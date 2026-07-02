import React, { useRef, useState } from 'react';

import { FileUploadOutlined } from '@mui/icons-material';
import { Button, CircularProgress, Stack, TextField } from '@mui/material';

import { IMAGE_UPLOAD_ENDPOINT, uploadImage } from './imageUpload';

type Props = {
  label: string;
  defaultValue: string;
  helperText?: string;
  onChange: (v: string) => void;
};

/**
 * URL text field with an "Upload image" button. Uploaded files are stored in
 * the Onchain Suite asset library (POST /assets) and the returned hosted
 * https URL is written into the field. See ./imageUpload.ts.
 */
export default function ImageUploadInput({ label, defaultValue, helperText, onChange }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setValue(url);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const displayValue = value.startsWith('data:') ? '(embedded image)' : value;

  return (
    <Stack spacing={0.5}>
      <TextField
        fullWidth
        variant="standard"
        label={label}
        value={displayValue}
        error={error !== null}
        helperText={error ?? helperText}
        onChange={(ev) => {
          const v = ev.target.value;
          setValue(v);
          setError(null);
          onChange(v);
        }}
      />
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          size="small"
          variant="outlined"
          disabled={uploading}
          startIcon={uploading ? <CircularProgress size={14} /> : <FileUploadOutlined fontSize="small" />}
          onClick={() => fileInputRef.current?.click()}
          title={`Uploads to your asset library (${IMAGE_UPLOAD_ENDPOINT})`}
        >
          {uploading ? 'Uploading…' : 'Upload image'}
        </Button>
      </Stack>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        hidden
        onChange={(ev) => handleFile(ev.target.files?.[0])}
      />
    </Stack>
  );
}
