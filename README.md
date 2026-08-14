# CommieCake

> **Data for all.**

An interactive sorting algorithm visualiser. Pick an algorithm, watch (and hear) it sort, look at some of the code for it, and race it against other algorithms. Built as a vanilla JS project for cloudflare pages.

You can view the actual site on cloudflare pages [here.][commiecake]

## Features

- **20 Algorithms**, of differing categories chosen through an intuitive UI palette
- **Live stats** such as elapsed time, comparisons / swaps made and time complexity
- **Benchmark mode** to run every algorithm on the same array that uses no resources on animations, and charts the results for comparison
- **Code panel** to view each algorithm's source code
- Toggleable **Sound effects** for every swap and comparison made during sorting
- **Responsive Scaling** to allow usability on desktop or mobile

## Getting Started

The project is a static website with no build step but it does use ES modules (`import`/`export` in JS) which browsers block from loading over a `file://` path. You need to serve it over `http://` locally:

- **VSCode**: Install the [Live Server][liveserver] extension, and launch a live server by right clicking on `index.html` and chooing "Open with live server."
- **OR**, from `public/` run:

    ```batch
    npx serve
    ```

## Adding a new Algorithm file

See [`public/algorithms/README.md`][algorithm] to see the exact creation process for custom algorithms and their metadata contract and how to sync them with the sort graph and more.

## Keyboard Shortcuts

| Key                             | Action                       |
| ------------------------------- | ---------------------------- |
| `Space`                         | Play / pause                 |
| `Right arrow`                   | Advance Step                 |
| `Esc`                           | Close any open popup/palette |
| `up/down arrows` (palette open) | Move selection               |
| `Enter` (palette open)          | Select                       |

## How it Works

Every algorithm is a JavaScript [**generator function**][generator] (`function*` / `yield`). Instead of sorting the array and returning a final result, it pauses after every action (usually comparison or swap) and yields a snapshot in form of: `{ array, comparing, swapping, sortedIndices, pivot }`. The UI drives the animation by repeatedly calling `.next()` on whichever generator is selected and drawing whatever it yields. This is what makes Step, Play, Benchmark, and the live counters all work off the exact same underlying algorithm code as none of them are special cased per algorithm.

## Special Thanks

Thanks to [@Eli-Zac][eli-zac] for helping me configure the cloudflare pages site and other technical things.<br>
Thanks to [@mustangCAR][raghav] for helping with inspiration and making the site favicon.

## License

See the [license][license] for more information.

<!-- LINKS -->

[commiecake]: https://commiecake.pages.dev
[liveserver]: https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer
[generator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*

<!-- PEOPLE -->

[eli-zac]: https://github.com/eli-zac
[raghav]: https://github.com/mustangcar

<!-- FILES -->

[algorithm]: public/algorithms/README.md
[license]: LICENSE
