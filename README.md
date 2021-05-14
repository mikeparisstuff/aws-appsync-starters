# aws-appsync-starters

A set of cool starter templates for websites built with AWS AppSync.

# A few project ideas

1. Recreate the sample app using [React](https://reactjs.org/)
2. Reacreate the sample app using [Vue](https://vuejs.org/)
3. Recreate the sample app using [React Native](https://reactnative.dev/)
4. Add features to the AppSync API
    - Use [`ethers.js`](https://docs.ethers.io/v5/) or [`web3`](https://web3js.readthedocs.io/en/v1.3.4/) to store user specific account information/balances.
    - Add a backend job that updates the price information automatically so no one needs to be using the page to get updated prices.
    - Add alarms or create a dashboard on top of the AppSync API metrics.
    - Connect a lambda function that does some additional processing on the priceHistory feed.
    - Add a caching rule that will cache price data for N minutes.
    - Add subscriptions using svelte's `onMount` and AppSync that publishing price changes anytime anyone refreshes the page.
5. A customer experience case study.
   - Work through building an AppSync API and think notice any and all sharp edges.
   - There can be quite a few pitfalls as you need to learn a few things such as: VTL, CloudFormation, AppSync specifics, GraphQL, CDK/AmplifyCLI, and more. Develop empathy with our customers and identify areas to improve.

If we think this is useful and you do build a sample app in some other framework, send a PR and I'll merge it. If we want
we can work on adding these to AWSLabs' Github.

# Getting Started

1. [Install CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html)
    - If this is your first time using CDK, you will need to `cdk bootstrap` (details on the page above)
2. Deploy your AppSync API & database
    -  `pnpm run cdk deploy --filter infra`
3. Start the development server
    - `pnpm run dev --filter sveltekit-app`

# Packages

## `packages/sveltekit-app`

A server-side rendered website built with SvelteKit.

## `packages/infra`

A CDK package that deploys an AppSync API and DynamoDB database.
