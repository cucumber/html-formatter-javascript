⚠️ This is an internal package; you don't need to install it in order to use the html formatter in `@cucumber/cucumber` as it's built in there.

# html-formatter

> Takes a stream of Cucumber messages and outputs a standalone HTML report using Cucumber's React components

## Manually testing incremental output

The generated HTML report can be viewed before the entire report has been generated. This can be tested manually.

    npm install
    npm run build
    npm run validate

You should now have some HTML reports under `html/*.html`. Let's render this incrementally:

    rm -f incremental.html
    touch incremental.html

    # open the empty file in a browser
    open incremental.html

    # incrementally write some contents into that file, simulating cucumber writing the file slowly
    cat html/examples-tables.feature.html | ./scripts/slowcat > incremental.html

Return to the browser. Keep refresh it. You should see that the report contents changes.
