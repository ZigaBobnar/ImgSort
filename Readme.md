# ImgSort

This utility takes all image files from a folder and reorganizes them into date based folder tree structure.

## Usage
- Copy `src/config-sample.ts` file into `src/config.ts` and update ingest and output paths
- Run tool using `npm run sort`

## Customization
By modifying `src/config.ts` file you can change the way this tool moves files, whether it should proceed executing commands and how the output path should be structured.

For most up to date information, please take a look at `SortConfig` interface in [lib/sort/sortConfig.ts](https://github.com/ZigaBobnar/ImgSort/blob/main/lib/sort/sortConfig.ts) file which contains the actual definitions of all available options.

### TLDR/More info on options:
- `ingestPath`: Specifies where input files are
- `outputPath`: Sets the output path where the tool will push processed files and where the result information is saved
- `moveOptions`: Choose how the files are moved to the output path. The default option is `copy`.
    - `move`: Use direct move command to "rename" the file path to new one
    - `copy`: Copy files to destination without removing original ones
    - `copyAndDeleteOld`: For each file do the copy operation and only then remove the original file
    - `ignore`: Disables the move/copy/delete operations entirely
- `mode`: Choose if the operations to do anything to the files are done or not (dry run scenario). The default option is `dryRun` so you can first review the potential changes.
    - `normal`: Runs all operations as it normally would
    - `dryRun`: Prevents the operations from executing but still generates a report file in which you can review all the changes that would be done to the files

## Results
With each run three files are generated in the output directory. The paths to those files can be observed in the console output.

After the initial import of files is done, the import data is stored under `import-___...___.json`. This file contains information about what directories need to exist (or need to be created), which file needs to be moved into what path and at the end an array of files that are causing problems. Due to reliance on Exif image data only JPEG images can be sorted, the rest of files will fall into problematic files category. Elements will contain the date object as it is read from modified date property of the file. This date can be deceiving so currently nothing is done with them.

Then the tool takes the import file and processes it into list of mkdir and move "commands". This list is saved as `sort-task-list-___...___.json`.

When the commands are executing the log of operations done is being stored into variable and at the end saved into `sort-tasks-done-___...___.txt`. In case of major problems with sorting this file could help to revert the operations if needed.

## Reverting operations
Run `npm run revert testing/output/sort-tasks-done-___...___.txt` to revert the operations inside specified tasklist.
This process will not revert the creation of directories (there could still be residual data in them). It will however try to revert the operations of copying/moving files.

If files were copied in the first place it will try to copy back to original location (in case file was removed there) and then remove the files from output directory (if the new and old paths are not the same).

If files were copied and then old ones removed or just moved, they will be moved with the same operation back to the old path.
