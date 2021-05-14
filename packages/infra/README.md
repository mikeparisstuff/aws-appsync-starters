# Welcome to the infrastructure package!

This is a CDK application that deploys an AppSync API, a DynamoDB table, and a few IAM resources.

To deploy your stack, you can run `pnpm run cdk deploy` from the `/packages/infras` path, or
you can run `pnpm run cdk deploy --filter infra` from any path in this repository. 

The `cdk.json` file tells the CDK Toolkit how to execute your app and in this case will run the `bin/infra.ts`
file using `ts-node` before passing the output to CDK.

## Useful commands

 * `pnpm run build`   compile typescript to js
 * `pnpm run watch`   watch for changes and compile
 * `pnpm run test`    perform the jest unit tests
 * `pnpm run cdk deploy`      deploy this stack to your default AWS account/region
 * `pnpm run cdk diff`        compare deployed stack with current state
 * `pnpm run cdk synth`       emits the synthesized CloudFormation template

## Our Infrastructure

Take a look at the `lib/infra-stack.ts` where we create these resources:

- APIDataTable: A DynamoDB table to store our price history.
- APIAccessRole: An IAM role giving AppSync permission to access the DynamoDB table.
- AppSyncAPI: An AppSync API with the schema found in `./schema.graphql`
- DDBTableDataSource: A DynamoDB data source connected to `APIDataTable` and that uses `APIAccessRole`
- PriceDataSource: An HTTP datasource connected to coingecko.
- GetPriceFunction: An AppSync FunctionConfiguration that fetches price data for a ticker.
- PutPriceFunction: An AppSync FunctionConfiguration that puts the historical price data into DynamoDB.
- QueryTickerResolver: An AppSync pipeline resolver that uses the `GetPriceFunction` and `PutPriceFunction` to fetch new prices and put them into DynamoDB within a single resolver.
- HistoricalPriceResolver: An AppSync unit resolver that queries price history for a ticker using `DDBTableDataSource`
