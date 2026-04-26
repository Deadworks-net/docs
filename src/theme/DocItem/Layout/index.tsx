import React, {useEffect} from 'react';
import OriginalLayout from '@theme-original/DocItem/Layout';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import type LayoutType from '@theme/DocItem/Layout';
import type {WrapperProps} from '@docusaurus/types';

type Props = WrapperProps<typeof LayoutType>;

declare global {
  interface Window {
    __devEditor?: {currentSource?: string};
  }
}

export default function LayoutWrapper(props: Props): JSX.Element {
  const {metadata} = useDoc();
  const source = (metadata as {source?: string}).source;

  useEffect(() => {
    if (typeof window === 'undefined' || !source) return;
    window.__devEditor ??= {};
    window.__devEditor.currentSource = source;
    window.dispatchEvent(new CustomEvent('dev-editor:source-change', {detail: {source}}));
  }, [source]);

  return <OriginalLayout {...props} />;
}
