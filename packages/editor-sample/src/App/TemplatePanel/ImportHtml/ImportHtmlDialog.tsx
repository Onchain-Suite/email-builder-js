import React, { useMemo, useState } from 'react';

import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
  Typography,
} from '@mui/material';

import { resetDocument } from '../../../documents/editor/EditorContext';
import CodeEditor from '../../InspectorDrawer/ConfigurationPanel/input-panels/helpers/inputs/CodeEditor';

import htmlToDocument, { THtmlImportResult } from './htmlToDocument';

type ImportHtmlDialogProps = {
  onClose: () => void;
};

export default function ImportHtmlDialog({ onClose }: ImportHtmlDialogProps) {
  const [value, setValue] = useState('');
  const [split, setSplit] = useState(true);

  const result = useMemo<{ data?: THtmlImportResult; error?: string } | null>(() => {
    if (value.trim().length === 0) {
      return null;
    }
    try {
      return { data: htmlToDocument(value, { split }) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Could not parse the HTML.' };
    }
  }, [value, split]);

  let statusAlert = null;
  if (result?.error) {
    statusAlert = <Alert severity="error">{result.error}</Alert>;
  } else if (result?.data) {
    const n = result.data.sectionCount;
    statusAlert = (
      <Alert severity="success">
        Ready to import as {n} editable section{n === 1 ? '' : 's'}.
      </Alert>
    );
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Import HTML</DialogTitle>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          if (!result?.data) {
            return;
          }
          resetDocument(result.data.document);
          onClose();
        }}
      >
        <DialogContent>
          <Typography color="text.secondary" paragraph>
            Paste the full HTML of an email (or a fragment). It is imported verbatim into HTML blocks — preview it,
            reorder or delete sections, and export as JSON or HTML. To edit a section&rsquo;s markup, select it on the
            canvas and use the inspector. Personalization tags like {'{{ profile.firstName }}'} are kept as-is and can
            be inserted from the inspector&rsquo;s Variable Tags picker; they are replaced per recipient at send time.
          </Typography>
          {statusAlert}
          <CodeEditor value={value} onChange={setValue} rows={16} placeholder="<html>…</html>" allowExpand={false} />
          <FormHelperText>This will override your current template.</FormHelperText>
          <FormControlLabel
            control={<Checkbox checked={split} onChange={(ev) => setSplit(ev.target.checked)} />}
            label="Split into sections (lets you reorder and delete parts of the email)"
          />
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" type="submit" disabled={!result?.data}>
            Import
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
