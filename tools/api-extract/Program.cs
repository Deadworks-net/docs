// Reads the DeadworksManaged.Api source and writes every public type and member,
// with its signature as written, its XML doc comment and its source line, to JSON.
// scripts/gen-api.ts turns that JSON into the API Reference pages.
//
// Usage: dotnet run --project tools/api-extract -- <deadworks repo> <commit> <out.json>

using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

if (args.Length != 3)
{
    Console.Error.WriteLine("Usage: api-extract <deadworks repo> <commit> <out.json>");
    return 1;
}

var repo = Path.GetFullPath(args[0]);
var apiDir = Path.Combine(repo, "managed", "DeadworksManaged.Api");
var types = new Dictionary<string, TypeInfo>();

foreach (var file in Directory.EnumerateFiles(apiDir, "*.cs", SearchOption.AllDirectories))
{
    var rel = Path.GetRelativePath(repo, file).Replace('\\', '/');
    if (rel.Contains("/obj/") || rel.Contains("/bin/"))
        continue;

    var tree = CSharpSyntaxTree.ParseText(File.ReadAllText(file), path: rel);
    var root = tree.GetCompilationUnitRoot();

    foreach (var decl in root.DescendantNodes().OfType<BaseTypeDeclarationSyntax>())
    {
        if (!IsPublicChain(decl))
            continue;

        var ns = decl.Ancestors().OfType<BaseNamespaceDeclarationSyntax>().FirstOrDefault()?.Name.ToString()
                 ?? root.Members.OfType<FileScopedNamespaceDeclarationSyntax>().FirstOrDefault()?.Name.ToString()
                 ?? "";
        var name = TypeName(decl);
        var key = $"{ns}.{name}";

        if (!types.TryGetValue(key, out var type))
        {
            type = new TypeInfo
            {
                Namespace = ns,
                Name = name,
                Kind = Kind(decl),
                Folder = Folder(rel),
            };
            types[key] = type;
        }

        // Partial types: the declaration with a doc comment, or the first one, supplies the header.
        var doc = Doc(decl);
        if (type.Declaration == null || (type.Doc == null && doc != null))
        {
            type.Declaration = Header(decl);
            type.File = rel;
            type.Line = Line(decl);
            type.Doc = doc;
            type.Obsolete = Obsolete(decl.AttributeLists);
        }
        if (decl.BaseList != null)
            foreach (var b in decl.BaseList.Types)
                if (!type.Bases.Contains(b.Type.ToString()))
                    type.Bases.Add(b.Type.ToString());

        if (decl is EnumDeclarationSyntax e)
        {
            foreach (var m in e.Members)
                type.Members.Add(new MemberInfo
                {
                    Kind = "enumValue",
                    Name = m.Identifier.Text,
                    Signature = m.EqualsValue != null ? $"{m.Identifier.Text} = {m.EqualsValue.Value}" : m.Identifier.Text,
                    Doc = Doc(m),
                    File = rel,
                    Line = Line(m),
                });
            continue;
        }

        if (decl is not TypeDeclarationSyntax t)
            continue;

        var isInterface = t is InterfaceDeclarationSyntax;
        foreach (var m in t.Members)
        {
            if (m is BaseTypeDeclarationSyntax || m is DelegateDeclarationSyntax)
                continue;
            if (!isInterface && !IsVisible(m.Modifiers))
                continue;
            if (isInterface && m.Modifiers.Any(SyntaxKind.PrivateKeyword))
                continue;

            var info = Member(m, name);
            if (info == null)
                continue;
            info.File = rel;
            info.Line = Line(m);
            info.Doc = Doc(m);
            info.Obsolete = Obsolete(m.AttributeLists);
            type.Members.Add(info);
        }
    }

    foreach (var d in root.DescendantNodes().OfType<DelegateDeclarationSyntax>())
    {
        if (!d.Modifiers.Any(SyntaxKind.PublicKeyword) || d.Parent is TypeDeclarationSyntax p && !IsPublicChain(p))
            continue;
        var ns = root.Members.OfType<FileScopedNamespaceDeclarationSyntax>().FirstOrDefault()?.Name.ToString()
                 ?? d.Ancestors().OfType<BaseNamespaceDeclarationSyntax>().FirstOrDefault()?.Name.ToString() ?? "";
        var name = d.Identifier.Text + (d.TypeParameterList?.ToString() ?? "");
        types[$"{ns}.{name}"] = new TypeInfo
        {
            Namespace = ns,
            Name = name,
            Kind = "delegate",
            Folder = Folder(rel),
            Declaration = Clean(d.WithAttributeLists(default).WithoutTrivia().ToString()),
            File = rel,
            Line = Line(d),
            Doc = Doc(d),
        };
    }
}

var output = new
{
    commit = args[1],
    types = types.Values.OrderBy(t => t.Namespace).ThenBy(t => t.Name).ToList(),
};
File.WriteAllText(args[2], JsonSerializer.Serialize(output, new JsonSerializerOptions
{
    WriteIndented = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
}));
Console.WriteLine($"Wrote {types.Count} types, {types.Values.Sum(t => t.Members.Count)} members to {args[2]}");
return 0;

static bool IsVisible(SyntaxTokenList mods) =>
    mods.Any(SyntaxKind.PublicKeyword) ||
    (mods.Any(SyntaxKind.ProtectedKeyword) && !mods.Any(SyntaxKind.PrivateKeyword));

static bool IsPublicChain(BaseTypeDeclarationSyntax decl)
{
    for (SyntaxNode? n = decl; n is BaseTypeDeclarationSyntax b; n = n.Parent)
        if (!b.Modifiers.Any(SyntaxKind.PublicKeyword))
            return false;
    return true;
}

static string TypeName(BaseTypeDeclarationSyntax decl)
{
    var parts = new List<string>();
    for (SyntaxNode? n = decl; n is BaseTypeDeclarationSyntax b; n = n.Parent)
        parts.Insert(0, b.Identifier.Text + (b is TypeDeclarationSyntax t ? t.TypeParameterList?.ToString() ?? "" : ""));
    return string.Join(".", parts);
}

static string Kind(BaseTypeDeclarationSyntax decl) => decl switch
{
    RecordDeclarationSyntax r => r.ClassOrStructKeyword.IsKind(SyntaxKind.StructKeyword) ? "record struct" : "record",
    ClassDeclarationSyntax c => c.Modifiers.Any(SyntaxKind.StaticKeyword) ? "static class" : "class",
    StructDeclarationSyntax => "struct",
    InterfaceDeclarationSyntax => "interface",
    EnumDeclarationSyntax => "enum",
    _ => "type",
};

static string Folder(string rel)
{
    var parts = rel.Split('/');
    // managed/DeadworksManaged.Api/<Folder>/File.cs
    return parts.Length > 3 ? parts[2] : "";
}

static int Line(SyntaxNode node)
{
    // First line of the declaration itself, after attributes and doc comments.
    var token = node switch
    {
        MemberDeclarationSyntax m when m.AttributeLists.Count > 0 => m.AttributeLists.Last().GetLastToken().GetNextToken(),
        _ => node.GetFirstToken(),
    };
    return token.GetLocation().GetLineSpan().StartLinePosition.Line + 1;
}

static string Header(BaseTypeDeclarationSyntax decl)
{
    var mods = string.Join(" ", decl.Modifiers.Select(m => m.Text));
    var kw = decl switch
    {
        RecordDeclarationSyntax r => "record" + (r.ClassOrStructKeyword.IsKind(SyntaxKind.None) ? "" : " " + r.ClassOrStructKeyword.Text),
        ClassDeclarationSyntax => "class",
        StructDeclarationSyntax => "struct",
        InterfaceDeclarationSyntax => "interface",
        EnumDeclarationSyntax => "enum",
        _ => "",
    };
    var name = decl.Identifier.Text + (decl is TypeDeclarationSyntax t ? t.TypeParameterList?.ToString() ?? "" : "");
    var parameters = decl is TypeDeclarationSyntax { ParameterList: { } pl } ? pl.ToString() : "";
    var bases = decl.BaseList != null ? " : " + string.Join(", ", decl.BaseList.Types.Select(b => b.ToString())) : "";
    var constraints = decl is TypeDeclarationSyntax tc && tc.ConstraintClauses.Count > 0
        ? " " + string.Join(" ", tc.ConstraintClauses.Select(c => c.ToString()))
        : "";
    return Clean($"{mods} {kw} {name}{parameters}{bases}{constraints}".Replace("partial ", ""));
}

static MemberInfo? Member(MemberDeclarationSyntax m, string typeName)
{
    switch (m)
    {
        case MethodDeclarationSyntax meth:
            return new MemberInfo
            {
                Kind = "method",
                Name = meth.Identifier.Text,
                Signature = Clean(meth.WithBody(null).WithExpressionBody(null).WithSemicolonToken(default)
                    .WithAttributeLists(default).WithoutTrivia().ToString()),
                Parameters = meth.ParameterList.Parameters.Select(p => p.Identifier.Text).ToList(),
                IsStatic = meth.Modifiers.Any(SyntaxKind.StaticKeyword),
                IsExtension = meth.ParameterList.Parameters.FirstOrDefault()?.Modifiers.Any(SyntaxKind.ThisKeyword) == true,
            };
        case ConstructorDeclarationSyntax ctor:
            if (ctor.Modifiers.Any(SyntaxKind.StaticKeyword))
                return null;
            return new MemberInfo
            {
                Kind = "constructor",
                Name = ctor.Identifier.Text,
                Signature = Clean(ctor.WithBody(null).WithExpressionBody(null).WithInitializer(null).WithSemicolonToken(default)
                    .WithAttributeLists(default).WithoutTrivia().ToString()),
                Parameters = ctor.ParameterList.Parameters.Select(p => p.Identifier.Text).ToList(),
            };
        case PropertyDeclarationSyntax prop:
        {
            var accessors = prop.AccessorList?.Accessors
                .Where(a => !a.Modifiers.Any(SyntaxKind.PrivateKeyword))
                .Select(a => (a.Modifiers.Count > 0 ? string.Join(" ", a.Modifiers.Select(x => x.Text)) + " " : "") + a.Keyword.Text + ";")
                .ToList() ?? ["get;"];
            var mods = string.Join(" ", prop.Modifiers.Select(x => x.Text));
            var init = prop.Initializer != null && IsSimpleValue(prop.Initializer.Value) ? $" = {prop.Initializer.Value};" : "";
            return new MemberInfo
            {
                Kind = "property",
                Name = prop.Identifier.Text,
                Signature = Clean($"{mods} {prop.Type} {prop.Identifier.Text} {{ {string.Join(" ", accessors)} }}{init}"),
                IsStatic = prop.Modifiers.Any(SyntaxKind.StaticKeyword),
            };
        }
        case IndexerDeclarationSyntax idx:
        {
            var accessors = idx.AccessorList?.Accessors
                .Where(a => !a.Modifiers.Any(SyntaxKind.PrivateKeyword))
                .Select(a => a.Keyword.Text + ";").ToList() ?? ["get;"];
            var mods = string.Join(" ", idx.Modifiers.Select(x => x.Text));
            return new MemberInfo
            {
                Kind = "indexer",
                Name = "this[]",
                Signature = Clean($"{mods} {idx.Type} this{idx.ParameterList} {{ {string.Join(" ", accessors)} }}"),
                Parameters = idx.ParameterList.Parameters.Select(p => p.Identifier.Text).ToList(),
            };
        }
        case FieldDeclarationSyntax field:
        {
            var v = field.Declaration.Variables.First();
            var mods = string.Join(" ", field.Modifiers.Select(x => x.Text));
            var init = v.Initializer != null && (field.Modifiers.Any(SyntaxKind.ConstKeyword) || IsSimpleValue(v.Initializer.Value))
                ? $" = {v.Initializer.Value}" : "";
            return new MemberInfo
            {
                Kind = "field",
                Name = v.Identifier.Text,
                Signature = Clean($"{mods} {field.Declaration.Type} {v.Identifier.Text}{init};"),
                IsStatic = field.Modifiers.Any(SyntaxKind.StaticKeyword) || field.Modifiers.Any(SyntaxKind.ConstKeyword),
            };
        }
        case EventFieldDeclarationSyntax ev:
        {
            var mods = string.Join(" ", ev.Modifiers.Select(x => x.Text));
            var v = ev.Declaration.Variables.First();
            return new MemberInfo
            {
                Kind = "event",
                Name = v.Identifier.Text,
                Signature = Clean($"{mods} event {ev.Declaration.Type} {v.Identifier.Text};"),
                IsStatic = ev.Modifiers.Any(SyntaxKind.StaticKeyword),
            };
        }
        case EventDeclarationSyntax ev2:
        {
            var mods = string.Join(" ", ev2.Modifiers.Select(x => x.Text));
            return new MemberInfo
            {
                Kind = "event",
                Name = ev2.Identifier.Text,
                Signature = Clean($"{mods} event {ev2.Type} {ev2.Identifier.Text};"),
                IsStatic = ev2.Modifiers.Any(SyntaxKind.StaticKeyword),
            };
        }
        case OperatorDeclarationSyntax op:
            return new MemberInfo
            {
                Kind = "operator",
                Name = "operator " + op.OperatorToken.Text,
                Signature = Clean(op.WithBody(null).WithExpressionBody(null).WithSemicolonToken(default)
                    .WithAttributeLists(default).WithoutTrivia().ToString()),
                Parameters = op.ParameterList.Parameters.Select(p => p.Identifier.Text).ToList(),
                IsStatic = true,
            };
        case ConversionOperatorDeclarationSyntax conv:
            return new MemberInfo
            {
                Kind = "operator",
                Name = $"{conv.ImplicitOrExplicitKeyword.Text} operator {conv.Type}",
                Signature = Clean(conv.WithBody(null).WithExpressionBody(null).WithSemicolonToken(default)
                    .WithAttributeLists(default).WithoutTrivia().ToString()),
                Parameters = conv.ParameterList.Parameters.Select(p => p.Identifier.Text).ToList(),
                IsStatic = true,
            };
    }
    return null;
}

static bool IsSimpleValue(ExpressionSyntax e) =>
    e is LiteralExpressionSyntax ||
    e is PrefixUnaryExpressionSyntax { Operand: LiteralExpressionSyntax } ||
    (e is MemberAccessExpressionSyntax ma && ma.Expression is IdentifierNameSyntax && e.ToString().Length < 60);

static string Clean(string s) => Regex.Replace(s, @"\s+", " ").Replace("( ", "(").Replace(" )", ")").Trim();

static string? Obsolete(SyntaxList<AttributeListSyntax> lists)
{
    foreach (var a in lists.SelectMany(l => l.Attributes))
        if (a.Name.ToString() is "Obsolete" or "ObsoleteAttribute" or "System.Obsolete")
            return a.ArgumentList?.Arguments.FirstOrDefault()?.Expression is LiteralExpressionSyntax lit
                ? lit.Token.ValueText
                : "";
    return null;
}

static DocInfo? Doc(SyntaxNode node)
{
    var trivia = node.GetLeadingTrivia()
        .Select(t => t.GetStructure())
        .OfType<DocumentationCommentTriviaSyntax>()
        .FirstOrDefault();
    if (trivia == null)
        return null;

    var raw = string.Join("\n", trivia.ToFullString().Split('\n').Select(l => Regex.Replace(l, @"^\s*///\s?", "")));
    XElement root;
    try { root = XElement.Parse("<doc>" + raw + "</doc>", LoadOptions.PreserveWhitespace); }
    catch { return new DocInfo { Summary = Regex.Replace(raw, "<[^>]+>", "").Trim() }; }

    var doc = new DocInfo
    {
        Summary = Text(root.Element("summary")),
        Remarks = Text(root.Element("remarks")),
        Returns = Text(root.Element("returns")),
        Value = Text(root.Element("value")),
        Example = Text(root.Element("example")),
    };
    foreach (var p in root.Elements("param"))
        doc.Params[(string?)p.Attribute("name") ?? ""] = Text(p) ?? "";
    foreach (var p in root.Elements("typeparam"))
        doc.TypeParams[(string?)p.Attribute("name") ?? ""] = Text(p) ?? "";
    foreach (var x in root.Elements("exception"))
        doc.Exceptions.Add(new ExceptionDoc { Type = Cref((string?)x.Attribute("cref")), Text = Text(x) ?? "" });
    foreach (var s in root.Elements("seealso"))
        doc.SeeAlso.Add(Cref((string?)s.Attribute("cref")));
    return doc;
}

// Converts a doc comment element to Markdown.
static string? Text(XElement? el)
{
    if (el == null)
        return null;
    var sb = new System.Text.StringBuilder();
    foreach (var n in el.Nodes())
        Append(sb, n);
    // Reflow prose (join wrapped lines, squeeze spaces), but leave code blocks exactly as written.
    var parts = Regex.Split(sb.ToString(), @"(```csharp\n[\s\S]*?\n```)");
    for (int i = 0; i < parts.Length; i += 2)
    {
        var text = parts[i];
        text = Regex.Replace(text, @"[ \t]*\n[ \t]*", "\n");
        text = Regex.Replace(text, @"(?<!\n)\n(?!\n|- )", " ");
        text = Regex.Replace(text, @"[ \t]{2,}", " ");
        parts[i] = text;
    }
    return Regex.Replace(string.Concat(parts), @"\n{3,}", "\n\n").Trim();
}

static void Append(System.Text.StringBuilder sb, XNode n)
{
    switch (n)
    {
        case XText t:
            sb.Append(t.Value);
            break;
        case XElement e:
            switch (e.Name.LocalName)
            {
                case "see":
                case "seealso":
                    if (e.Attribute("cref") is { } cref)
                        sb.Append("{@cref " + Cref(cref.Value) + "}");
                    else if (e.Attribute("langword") is { } lw)
                        sb.Append('`').Append(lw.Value).Append('`');
                    else if (e.Attribute("href") is { } href)
                        sb.Append('[').Append(e.Value.Length > 0 ? e.Value : href.Value).Append("](").Append(href.Value).Append(')');
                    break;
                case "paramref":
                case "typeparamref":
                    sb.Append('`').Append((string?)e.Attribute("name")).Append('`');
                    break;
                case "c":
                    sb.Append('`').Append(e.Value).Append('`');
                    break;
                case "code":
                    sb.Append("\n```csharp\n").Append(Dedent(e.Value)).Append("\n```\n");
                    break;
                case "para":
                    sb.Append("\n\n");
                    foreach (var c in e.Nodes()) Append(sb, c);
                    sb.Append("\n\n");
                    break;
                case "list":
                    sb.Append("\n\n");
                    foreach (var item in e.Elements("item"))
                    {
                        sb.Append("\n- ");
                        var term = item.Element("term");
                        var desc = item.Element("description");
                        if (term != null) { foreach (var c in term.Nodes()) Append(sb, c); if (desc != null) sb.Append(": "); }
                        if (desc != null) foreach (var c in desc.Nodes()) Append(sb, c);
                        if (term == null && desc == null) foreach (var c in item.Nodes()) Append(sb, c);
                    }
                    sb.Append("\n\n");
                    break;
                case "br":
                    sb.Append("\n\n");
                    break;
                default:
                    foreach (var c in e.Nodes()) Append(sb, c);
                    break;
            }
            break;
    }
}

static string Dedent(string code)
{
    var lines = code.Trim('\n', '\r').Split('\n').Select(l => l.TrimEnd('\r')).ToList();
    var indent = lines.Where(l => l.Trim().Length > 0).Select(l => l.Length - l.TrimStart().Length).DefaultIfEmpty(0).Min();
    return string.Join("\n", lines.Select(l => l.Length >= indent ? l[indent..] : l.TrimStart()));
}

static string Cref(string? cref)
{
    if (cref == null)
        return "";
    // T:Namespace.Type, M:Namespace.Type.Method(args), P:..., or a plain name.
    var s = Regex.Replace(cref, @"^[A-Z]:", "");
    s = Regex.Replace(s, @"\(.*\)$", "");
    s = s.Replace("DeadworksManaged.Api.", "");
    s = Regex.Replace(s, @"`\d+", "");
    s = s.Replace('{', '<').Replace('}', '>');
    return s;
}

class TypeInfo
{
    public string Namespace { get; set; } = "";
    public string Name { get; set; } = "";
    public string Kind { get; set; } = "";
    public string Folder { get; set; } = "";
    public string? Declaration { get; set; }
    public string? File { get; set; }
    public int Line { get; set; }
    public DocInfo? Doc { get; set; }
    public string? Obsolete { get; set; }
    public List<string> Bases { get; set; } = [];
    public List<MemberInfo> Members { get; set; } = [];
}

class MemberInfo
{
    public string Kind { get; set; } = "";
    public string Name { get; set; } = "";
    public string Signature { get; set; } = "";
    public List<string>? Parameters { get; set; }
    public bool IsStatic { get; set; }
    public bool IsExtension { get; set; }
    public string? File { get; set; }
    public int Line { get; set; }
    public DocInfo? Doc { get; set; }
    public string? Obsolete { get; set; }
}

class DocInfo
{
    public string? Summary { get; set; }
    public string? Remarks { get; set; }
    public string? Returns { get; set; }
    public string? Value { get; set; }
    public string? Example { get; set; }
    public Dictionary<string, string> Params { get; set; } = [];
    public Dictionary<string, string> TypeParams { get; set; } = [];
    public List<ExceptionDoc> Exceptions { get; set; } = [];
    public List<string> SeeAlso { get; set; } = [];
}

class ExceptionDoc
{
    public string Type { get; set; } = "";
    public string Text { get; set; } = "";
}
