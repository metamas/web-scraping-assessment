import inquirer from 'inquirer';

async function promptForCredentials(websiteName: string): Promise<{ username: string, password: string }>{
  const questions = [
    {
      type: 'input',
      name: 'username',
      message: `Enter your ${websiteName} username:`,
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return `Please enter your ${websiteName} username.`;
        }
      }
    },
    {
      type: 'password',
      name: 'password',
      message: `Enter your ${websiteName} password:`,
      mask: '*',
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return `Please enter your ${websiteName} password.`;
        }
      }
    }
  ];

  const credentials = await inquirer.prompt(questions);
  return credentials;
}

export default promptForCredentials;
