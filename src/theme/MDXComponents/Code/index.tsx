import React from 'react';
import OriginalCode from '@theme-original/MDXComponents/Code';

type Props = React.ComponentProps<typeof OriginalCode> & {
  'data-md-start'?: string;
  'data-md-end'?: string;
};

export default function CodeWrapper(props: Props): JSX.Element {
  const start = props['data-md-start'];
  const end = props['data-md-end'];
  // Only wrap fenced (multiline) code blocks. Inline code uses inlineCode mdast
  // nodes which the source-lines plugin doesn't tag.
  const isBlock =
    typeof props.children === 'string' && props.children.includes('\n');
  if (start && isBlock) {
    return (
      <div data-md-start={start} data-md-end={end}>
        <OriginalCode {...props} />
      </div>
    );
  }
  return <OriginalCode {...props} />;
}
