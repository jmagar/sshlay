import { NextRequest, NextResponse } from 'next/server';
import { importSSHConfig, importSSHConfigFile } from '@/server/lib/ssh.js';
import type { ImportResult } from '@/types';

/**
 * Maximum file size for SSH config uploads (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed file extensions for SSH config files
 */
const ALLOWED_EXTENSIONS = ['.conf', '.config', '.txt'];

/**
 * Validates a file upload for SSH config import
 * @param {File} file - The uploaded file
 * @returns {string|null} Error message if validation fails, null if valid
 */
function validateConfigFile(file: File): string | null {
  if (!file) {
    return 'No file provided';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File size exceeds 5MB limit';
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return 'Invalid file type. Allowed types: .conf, .config, .txt';
  }

  return null;
}

/**
 * POST /api/ssh-connections/import
 *
 * Handles SSH config file uploads and imports the configurations.
 * Supports multipart/form-data uploads with file size and type validation.
 *
 * @param {NextRequest} req - The incoming request with form data
 * @returns {Promise<NextResponse>} JSON response with import results or error
 */
export async function POST(req: NextRequest): Promise<NextResponse<ImportResult>> {
  try {
    const formData = await req.formData();
    const configFile = formData.get('config') as File;

    // Validate the uploaded file
    const validationError = validateConfigFile(configFile);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // Read and parse the file content
    const configContent = await configFile.text();
    if (!configContent.trim()) {
      return NextResponse.json(
        { success: false, error: 'Config file is empty' },
        { status: 400 }
      );
    }

    // Import the SSH config
    const result = await importSSHConfig(configContent);

    if (!result.success) {
      console.error('SSH config import failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to import SSH config',
          imported: result.imported // Include partial results if any
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importing SSH config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import SSH config'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ssh-connections/import
 *
 * Imports SSH config from a specified file path (e.g., ~/.ssh/config).
 * Handles path validation and expansion of home directory.
 *
 * @param {NextRequest} req - The incoming request with path in body
 * @returns {Promise<NextResponse>} JSON response with import results or error
 */
export async function PUT(req: NextRequest): Promise<NextResponse<ImportResult>> {
  try {
    const { path } = await req.json();

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'No path provided' },
        { status: 400 }
      );
    }

    // Validate the path (basic security check)
    if (path.includes('..') || !path.includes('.ssh/config')) {
      return NextResponse.json(
        { success: false, error: 'Invalid path. Only ~/.ssh/config is supported.' },
        { status: 400 }
      );
    }

    // Import the SSH config from the specified path
    const result = await importSSHConfigFile(path);

    if (!result.success) {
      console.error('SSH config import failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to import SSH config',
          imported: result.imported // Include partial results if any
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importing SSH config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import SSH config'
      },
      { status: 500 }
    );
  }
}
