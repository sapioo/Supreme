import {
  Clipboard,
  FileOutput,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

export default function EditorChromeBar({
  breadcrumb,
  showRightSidebar,
  onToggleSidebar,
  onCopy,
  copyState,
  onExportPdf,
  exportState,
  isExportDisabled = false,
  editorLayout,
  onEditorLayoutChange,
}) {
  const layoutMode = editorLayout === 'split' ? 'split' : 'single';

  return (
    <header className="drafting-editor-bar">
      <div className="drafting-editor-bar__identity">
        <div className="drafting-editor-bar__main">
          {breadcrumb ? (
            <div className="drafting-editor-bar__breadcrumb">
              {breadcrumb}
            </div>
          ) : null}
          <span className="drafting-editor-bar__ai-label">AI</span>
        </div>
      </div>

      <Tabs
        value={layoutMode}
        onValueChange={(value) => {
          if (value === 'single') {
            onEditorLayoutChange(editorLayout === 'preview' ? 'preview' : 'source');
            return;
          }
          onEditorLayoutChange('split');
        }}
        className="drafting-editor-layout-tabs"
      >
        <TabsList aria-label="Source and preview layout">
          <TabsTrigger value="single">One</TabsTrigger>
          <TabsTrigger value="split">Split</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="drafting-editor-bar__actions">
        <div className="drafting-editor-bar__action-group">
          <Button
            variant="outline"
            className={`drafting-editor-bar__sidebar-toggle ${showRightSidebar ? 'drafting-editor-bar__sidebar-toggle--active' : ''}`}
            onClick={onToggleSidebar}
            aria-label={showRightSidebar ? 'Hide AI sidebar' : 'Show AI sidebar'}
            title={showRightSidebar ? 'Hide AI sidebar' : 'Show AI sidebar'}
            size="icon"
          >
            {showRightSidebar ? (
              <PanelLeftClose className="drafting-editor-bar__icon drafting-editor-bar__icon--strong" />
            ) : (
              <PanelLeftOpen className="drafting-editor-bar__icon drafting-editor-bar__icon--strong" />
            )}
          </Button>
        </div>

        <div className="drafting-editor-bar__action-group">
          <Button
            variant="outline"
            className="drafting-editor-bar__export"
            onClick={onExportPdf}
            disabled={isExportDisabled}
            aria-label={exportState}
            title={exportState}
          >
            <FileOutput className="drafting-editor-bar__icon" />
            <span>{exportState}</span>
          </Button>
        </div>

        <div className="drafting-editor-bar__action-group">
          <Button
            className="drafting-editor-bar__copy"
            onClick={onCopy}
            size="icon"
            aria-label={copyState}
            title={copyState}
          >
            <Clipboard className="drafting-editor-bar__icon drafting-editor-bar__icon--strong" />
          </Button>
        </div>
      </div>
    </header>
  );
}
