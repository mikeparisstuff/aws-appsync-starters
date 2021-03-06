# Welcome to your SvelteKit website!

This package contains a starter template that implements a "mostly" server-side rendered website using Svelte & SvelteKit.

Why might I want to build a server-side rendered website? 

The main reason, in my opinion, is that its much more SEO friendly as google, bing, and friends do not need to run JS 
in order to render the content on the page by default. When you load a single-page application, the browser needs run 
javascript in order to generate the HTML that will actually get indexed by the search engine. For this 
to work, it requires that each search engine robot have full, modern browser environments and while most search engines 
are getting better, its much easier to get better SEO results with an SSR website.

Why would I not want to use SSR?

The main downside is that you need to run a server. If you build a SPA, you can often just deploy it to something like
Amplify console, GitHub pages, Netlify, etc. Deploying static SPA's scale up forever and require less infrastructure to
run.

Why did I say "mostly" in the opening sentence?

SvelteKit will always render the first page load of a session on the server. This is good as requests coming from
SEO robots trigger this and thus they get back plain HTML that is easy to parse and index. However, SvelteKit goes
a bit further and also uses a service-worker on the client to orchestrate things such that after the initial page load,
things will start hydrating directly on the client.

This is trying to accomplish a "best of both worlds" where we get the SEO friendliness of SSR as well as the fluid &
dynamic user experience of a SPA within the same package. A downside of this is that it can sometimes be a bit tricky
to figure out if your SvelteKit logic is running on the server or client at any given time. You should use svelte's
[`onMount`](https://svelte.dev/tutorial/onmount) lifecycle hook to write code that only executes on the client when using SvelteKit.

# What is in this project

## `/src/app.html`

This will typically be the only .html file in a sveltekit project. SvelteKit will replace the value of
`%svelte.body%` with the fully evaluated HTML body of your application, given some route. SvelteKit apps
are server-side rendered and thus by the time HTML is delivered to your users, this HTML is fully hydrated.

## `/src/global.d.ts`

You can use this file to include additional typings that the typescript compiler is aware of.
This can be useful if you want to pull in a library that does not export typescript typings or
have a corresponding `@types/<module>` registered with DefinitelyTyped although this is increasingly rare.
Link to [DefinitelyTyped Repo](https://github.com/DefinitelyTyped/DefinitelyTyped)

## `/src/global.css`

This project uses [tailwindcss](https://tailwindcss.com/) for styling. I spent all of 5 minutes styling this thing but it
is setup fairly well to leverage tailwind which is a powerful and popular CSS framework. My favorite part of tailwind is
that it also operates somewhat like a compiler in that it will only include the styles associated with classes or utilities
that you are using in your code. This means you get to use the full CSS framework but you only pay for what you use in
terms of production bundle size. Bundle creep is very easy to ignore but it makes a big different in terms of load time.

## `/src/routes/[ticker].svelte`

The `/src/routes` directory is special in SvelteKit. Every `*.svelte` file in this directory becomes a route in your
website. By using the `[ticker]` syntax, I am telling SvelteKit to match the path pattern and expose it to me in the
component via `page.params.ticker` in the `load` function. This allows us to change the content of the page depending
on the URL in the browser.

Our `[ticker].svelte` route is simple, it uses SvelteKit's `load` function to issue a single GraphQL query to our
AppSync API that contains all the data that we need to hydrate the HTML for that route. GraphQL offers us a really
nice pattern in this case, as we can do a single HTTP request per page load that gets all the data that we need to render
the entire page.

Our AppSync API is doing two main things for us.

1. The `Query.ticker` field has a pipeline resolver that will fetch the current price of a cryptocurrency from coingecko and then saves that price data along with a timestamp in a DynamoDB table.
2. The `TickerInfo.priceHistory` field will query the DynamoDB table that is used in (1) in order to read the price history for some asset.

Our `[ticker].svelte` route uses this query to 1) get the data from coingecko, 2) save the data in DynamoDB, and 3) read the price history for the asset w/ pagination controls

```graphql
query Ticker($ticker: String!, $limit: Int) {
  ticker(ticker: $ticker) {
    ticker
    latestPrice {
      usd
    }
    priceHistory(limit:$limit) {
      items {
        ticker
        priceUSD
        timestamp
      }
      nextToken
    }
  }
}
```

## Creating a project

If you want to create your own project from scratch, you can run these commands

```bash
# create a new project in the current directory
npm init svelte@next

# create a new project in my-app
npm init svelte@next my-app
```

> Note: the `@next` is temporary

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

Before creating a production version of your app, install an [adapter](https://kit.svelte.dev/docs#adapters) for your target environment. Then:

```bash
npm run build
```

> You can preview the built app with `npm run preview`, regardless of whether you installed an adapter. This should _not_ be used to serve your app in production.
