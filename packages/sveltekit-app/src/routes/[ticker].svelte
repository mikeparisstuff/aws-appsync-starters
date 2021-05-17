<!--
Svelte files look like plain HTML at first glance, but Svelte & Svelte Kit have a lot of goodies baked in, and its
worth reading through the documentation to get a deeper understanding for how this all works (https://svelte.dev/) & (https://kit.svelte.dev/).

The TLDR is that `svelte` is similar in spirit to react but most of the complicated work is done at
compile time in svelte instead of runtime, like in react. A by-product of this is that svelte applications
can be like really, really fast. Think of Svelte as a library (similar to how react frames itself) but
also as a compiler that collects svelte, js/ts, and other input sources and produces an optimized JS
that implements your logic on top of the browser DOM.

SvelteKit is to svelte as a tool like Next.js is to react or Nuxt.js is to vue. It provides some opinionated
guard rails that make it way easier than it should be to build an efficient, server-side rendered application.
This file exists at `routes/index.svelte` which according to SvelteKit rules means that it will serve the root
of our webpage (i.e. `www.mysite.com/`). In other words, SvelteKit provides an HTTP server and some wiring
smarts that make it easy to turn your svelte components into full website routes that are SEO-friendly.
-->
<script context="module" lang="ts">
    /**
     * Take a note of the `context="module"` in the <script /> tag above. This is another SvelteKit specific feature
     * that allows this block of code to run prior to rendering the page on the server. This is useful to us as it
     * provides us a convenient hook in which we can query our AppSync API to fetch all the data needed for this route.
     *
     * There are a lot of options when it comes to GraphQL clients in large client applications:
     *  - Apollo Client: IMO, its heavy weight and unnecessary in an SSR environment.
     *      - If you want a feature-full client cache, its a good option (https://www.apollographql.com/docs/react/)
     *  - GraphQL-WS: My personal favorite websocket client (https://github.com/enisdenjo/graphql-ws)
     *      - Its has no dependencies and is a lightweight addition to an application. This is also unnecessary in our
     *          SSR environment because we will not be using websockets as data will be hydrated on the server.
     *      - Unfortunately, I do not believe it works out of the box w/ AppSync subscriptions but I haven't confirmed this yet.
     *  - AmplifyJS: Our friends at Amplify package a GraphQL client within AmplifyJS (https://github.com/aws-amplify/amplify-js).
     *      - This is also a very feature-full offering and includes extras like client side caching and offline support.
     *
     * For this application, we are going to use none of it. We are going to `fetch` because `fetch` is great, included by
     * default, and familiar to anyone that has ever built websites. GraphQL makes `fetch` even better because the complexity
     * is abstracted by the GraphQL query and thus we do not need a complicated SDK or client.
     */

    import type {LoadInput, LoadOutput} from "@sveltejs/kit/types/page";

    // This is generally a bad idea to store credentials directly in the JS code like this. Even though SvelteKit is
    // SSR most of the time, there are times when this function can be run on the client and thus these could be leaked.
    // It would be better if we were using OIDC/Cognito/IAM/etc.
    const appsyncEndpoint = 'https://glhimdmw2rh5zm5vqaptrdl5ku.appsync-api.us-west-2.amazonaws.com/graphql'
    const appsyncApiKey = 'da2-gozaaexjebdavg2xbofeqgvasy'
    const limit = 25

    /**
     * We use AppSync to load all of the data that we need for this route in a single HTTP request.
     * As your application grows, you can tweak your query to get more data such that the components that render
     * the application do not need to worry about fetching data.
     *
     * This pattern is particularly useful with SSR applications but if you were building an SPA, you would likely
     * so this differently and would start considering things such as client side, normalized caches and more feature
     * rich frontend tooling for GraphQL like Facebook's RelayJS or ApolloClient et al.
     */
    export async function load({ page, fetch }: LoadInput): Promise<LoadOutput> {
        // We get the ticker from the glob pattern in the URL
        const ticker = page.params.ticker || 'bitcoin'
        const res = await fetch(appsyncEndpoint, {
            method: 'POST',
            body: JSON.stringify({
                variables: { ticker, limit },
                query: `\
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
                `
            }),
            headers: {
                'x-api-key': appsyncApiKey
            }
        })

        // If the HTTP response returned a 200, pass the data as props to the component.
        if (res.ok) {
            const prices = await res.json()
            const tickerInfo = prices?.data?.ticker
            return {
                status: 200,
                props: {
                    tickerInfo
                }
            }
        }
        /**
         * Surface any errors. In prod, likely redirect to some stock error page
         * with some dinosaur game to play...
         */
        return {
            status: res.status,
            error: new Error(`Could not load ${appsyncEndpoint}`)
        }
    }
</script>

<script lang="ts">
    /**
     * This is normal svelte <script /> and thus runs within the normal component lifecycle. It defines two props,
     * ticker & prices that are provided data by the pre-render phase's load function in the "module" <script /> above.
     */
    interface TickerInfo {
        ticker: string
        latestPrice: {
            usd: number
        },
        priceHistory: {
            items: {ticker: string, priceUSD: number, timestamp: string}[],
            nextToken: string
        }
    }
    export let tickerInfo: TickerInfo

    export function formatMoney(amount: number, decimalCount = 2, decimal = ".", thousands = ","): string {
        decimalCount = Math.abs(decimalCount);
        decimalCount = isNaN(decimalCount) ? 2 : decimalCount;
        const negativeSign = amount < 0 ? "-" : "";
        const cleanedNumber = Math.abs(Number(amount) || 0).toFixed(decimalCount)
        const rawI = parseInt(cleanedNumber)
        const i = rawI.toString();
        const j = (i.length > 3) ? i.length % 3 : 0;
        return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - rawI).toFixed(decimalCount).slice(2) : "");
    }
</script>

{#if tickerInfo?.latestPrice?.usd}
    <div class="w-full px-0 lg:px-4">
        <div class="flex flex-wrap items-center justify-center py-4 pt-0">
            <div class="flex-grow">
            </div>

            <div class="w-full md:w-1/2 lg:w-1/2 drop-shadow-md">
                <label class="flex flex-col rounded-lg shadow-lg relative cursor-pointer hover:shadow-2xl">
                    <div class="w-full px-4 py-8 rounded-t-lg bg-green-500">
                        <h3 class="mx-auto text-base font-semibold text-center underline group-hover:text-white">
                            {tickerInfo.ticker.charAt(0).toUpperCase() + tickerInfo.ticker.slice(1, tickerInfo.ticker.length)}
                        </h3>
                        <p class="text-5xl font-bold text-center">
                            <span class="text-3xl">${formatMoney(tickerInfo.latestPrice.usd, 2)}</span>
                        </p>
                    </div>
                    <div class="flex flex-col items-center justify-center w-full h-full py-6 rounded-b-lg bg-white">
                        <p class="text-xl">
                            Historical Prices
                        </p>
                        <table class="table-auto w-full">
                            <thead>
                            <tr>
                                <th>Date</th>
                                <th>Price</th>
                            </tr>
                            </thead>
                            <tbody>
                            {#each tickerInfo.priceHistory.items as item}
                                <tr>
                                    <td class="text-center">{new Date(item.timestamp).toLocaleString()}</td>
                                    <td class="text-center">${formatMoney(item.priceUSD, 2)}</td>
                                </tr>
                            {/each}
                            </tbody>
                        </table>
                    </div>
                </label>
            </div>

            <div class="flex-grow">
            </div>

        </div>
    </div>
{:else}
    <h2>Ticker Not Found</h2>
{/if}
