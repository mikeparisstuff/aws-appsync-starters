# Welcome to the infrastructure package!

This is a CDK application that deploys an AppSync API, a DynamoDB table, and a few IAM resources.

To deploy your stack, you can run `pnpm run cdk deploy` from the `/packages/infrastructure` path, or
you can run `pnpm run cdk deploy --filter infrastructure` from any path in this repository. 

The `cdk.json` file tells the CDK Toolkit how to execute your app and in this case will run the `bin/infrastructure.ts`
file using `ts-node` before passing the output to CDK.

## Useful commands

 * `pnpm run build`   compile typescript to js
 * `pnpm run watch`   watch for changes and compile
 * `pnpm run test`    perform the jest unit tests
 * `pnpm run cdk deploy`      deploy this stack to your default AWS account/region
 * `pnpm run cdk diff`        compare deployed stack with current state
 * `pnpm run cdk synth`       emits the synthesized CloudFormation template
