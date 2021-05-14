# aws-appsync-starters

A starter template that uses SvelteKit & AWS AppSync.

## Getting Started

1. [Install CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html)
    - If this is your first time using CDK, you will need to `cdk bootstrap` (details on the page above)
2. Deploy your AppSync API & database
    -  `pnpm run cdk deploy --filter infra`
3. Start the development server
    - `pnpm run dev --filter sveltekit-app`

## `packages/sveltekit-app`

A server-side rendered website built with SvelteKit.

## `packages/infra`

A CDK package that deploys an AppSync API and DynamoDB database.
