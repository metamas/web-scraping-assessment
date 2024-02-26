import inquirer from "inquirer";

async function promptForCredentials(websiteName: string): Promise<{ username: string; password: string }> {
  const questions = [
    {
      type: "input",
      name: "username",
      message: `Enter your ${websiteName} username/email:`,
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return `Please enter your ${websiteName} username/email.`;
        }
      },
    },
    {
      type: "password",
      name: "password",
      message: `Enter your ${websiteName} password:`,
      mask: "*",
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return `Please enter your ${websiteName} password.`;
        }
      },
    },
  ];

  const credentials = await inquirer.prompt(questions);
  return credentials;
}

async function promptForAction(): Promise<string> {
  const question = {
    type: "list",
    name: "action",
    message: "What would you like to do?",
    choices: ["Retrieve recent orders", "Search for orders"],
  };

  const { action } = await inquirer.prompt([question]);
  return action;
}

async function promptForLimit(): Promise<number> {
  const question = {
    type: "number",
    name: "limit",
    message: "Give a maximum number of recent orders to retrieve.",
    default: 10,
    validate: function (value: number) {
      const valid = !isNaN(value);
      return valid || "Please enter a number.";
    },
  };

  const { limit } = await inquirer.prompt([question]);
  return parseInt(limit);
}

async function promptForSearches(): Promise<string> {
  const question = {
    type: "input",
    name: "searches",
    message: "Give a list of searches to perform, separated by commas.",
    validate: function (value: string) {
      const terms = value
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
      const valid = terms.length > 0;
      return valid || "Please enter at least one search string.";
    },
  };

  const { searches } = await inquirer.prompt([question]);
  return searches;
}

async function promptForContinue(): Promise<boolean> {
  const question = {
    type: "confirm",
    name: "again",
    message: "Would you like to continue?",
  };

  const { again } = await inquirer.prompt([question]);
  return again;
}

export { promptForCredentials, promptForAction, promptForSearches, promptForLimit, promptForContinue };
