#!/usr/bin/env node
const { Command } = require("commander");
const shell = require("shelljs");
const path = require("path");
const fs = require("fs");
const { prompt } = require("inquirer");
const packageInfo = require("./package.json");

const CWD = process.cwd();
const program = new Command();

const colorReference = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",

  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",

  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m",
};

program.version(packageInfo.version).description("Git Push Cli Application");

// Deploy any folder to github branch
program.argument("[folderName]").action(async (folderName) => {
  try {
    if (!folderName) {
      const { inputFolderNumber } = await prompt([
        {
          type: "input",
          name: "inputFolderNumber",
          message: `Enter your prefer folderName to deploy in github: `,
        },
      ]);
      if (!inputFolderNumber) {
        console.log(
          colorReference.FgRed,
          `Error: foldername can not be empty, please provide valid foldername`,
          colorReference.Reset
        );
        shell.exit(1);
      }
      folderName = inputFolderNumber;
    }
    const userInputTargetFolderPath = path.join(CWD, folderName);
    if (!folderName || !fs.existsSync(userInputTargetFolderPath)) {
      console.log(
        colorReference.FgRed,
        `Error: Given folder ${userInputTargetFolderPath} does not exists or invalid folder, please provide valid foldername`,
        colorReference.Reset
      );
      shell.exit(1);
    }

    await workingOnGit(userInputTargetFolderPath);

    console.info(colorReference.FgGreen, `Completed`, colorReference.Reset);
    process.exit();
  } catch (error) {
    console.log(
      colorReference.FgRed,
      "Error: error executing command ",
      error,
      colorReference.Reset
    );
  }
});

program.parse(process.argv);

/**
 * This will deploy the given folder to github branch
 * @param {string} folderToDeploy
 * @returns
 */
async function workingOnGit(folderToDeploy) {
  console.log(
    colorReference.FgMagenta,
    "....Working on git....",
    colorReference.Reset
  );
  // checking git and working on git
  if (!shell.which("git")) {
    console.log(
      colorReference.FgRed,
      "Sorry, this script requires git",
      colorReference.Reset
    );
    shell.exit(1);
  }
  // Findout git origin
  const CURRENT_GIT_ORIGIN_RESULT = shell.exec(
    "git config --get remote.origin.url"
  );
  if (CURRENT_GIT_ORIGIN_RESULT.code !== 0) {
    console.log(
      colorReference.FgRed,
      "Error: Please make sure you have git initialized and added the remote origin, Try again later..",
      colorReference.Reset
    );
    shell.exit(1);
  }
  const CURRENT_GIT_ORIGIN = CURRENT_GIT_ORIGIN_RESULT.stdout.replace(
    /(\n|\r)/g,
    ""
  );
  console.log(
    colorReference.FgCyan,
    "Your current git origin: ",
    CURRENT_GIT_ORIGIN,
    colorReference.Reset
  );
  // switching to release directory to work on git operation
  shell.cd(folderToDeploy);
  // initialized git
  shell.exec("git init");
  // Set remote origin
  shell.exec(`git remote add origin "${CURRENT_GIT_ORIGIN}"`);

  // Get prefer branch name and commit message
  const DEFAULT_BRANCH_NAME = "frontend-release";
  const DEFAULT_COMMIT_MESSAGE = "release with build";
  const { branchName, commitMessage } = await prompt([
    {
      type: "input",
      name: "branchName",
      message: `Enter your prefer branch name: [default:${DEFAULT_BRANCH_NAME}]: `,
    },
    {
      type: "input",
      name: "commitMessage",
      message: `Enter your commit message: [default:${DEFAULT_COMMIT_MESSAGE}]: `,
    },
  ]);
  const BRANCH_NAME = branchName || DEFAULT_BRANCH_NAME;
  const COMMIT_MESSAGE = commitMessage || DEFAULT_COMMIT_MESSAGE;

  // Do basic git operation to push to prefer branch
  shell.exec(`git checkout -b "${BRANCH_NAME}"`);
  shell.exec(`git add .`);
  shell.exec(`git commit -m "${COMMIT_MESSAGE}"`);
  shell.exec(`git push -f origin "${BRANCH_NAME}"`);

  console.info(
    colorReference.FgGreen,
    `${folderToDeploy} is successfully Deployed to git 😀 ,please check on your ${BRANCH_NAME} branch in github(${CURRENT_GIT_ORIGIN})`,
    colorReference.Reset
  );

  return { CURRENT_GIT_ORIGIN, BRANCH_NAME, COMMIT_MESSAGE };
}
