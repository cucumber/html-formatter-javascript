import { NdjsonToMessageStream } from '@cucumber/message-streams'
import assert from 'assert'
import fs from 'fs'
import glob from 'glob'
import path from 'path'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import puppeteer from 'puppeteer'
import { PassThrough, pipeline } from 'stream'

import CucumberHtmlStream from '../src/CucumberHtmlStream'

async function renderHtml(
  html: string,
  block: (page: puppeteer.Page) => Promise<void>
): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.setContent(html)
  await page.waitForSelector('[data-testid="cucumber-react"]')
  await block(page)
  await browser.close()
}

describe('html-formatter', () => {
  const files = glob.sync(
    `./node_modules/@cucumber/compatibility-kit/features/**/*.ndjson`
  )
  for (const ndjson of files) {
    const example = path.basename(ndjson, '.ndjson')
    it(`can render ${example}`, async () => {
      const ndjsonData = fs.createReadStream(ndjson, { encoding: 'utf-8' })
      const toMessageStream = new NdjsonToMessageStream()
      const htmlData = await new Promise<string>((resolve, reject) => {
        const chunks: Buffer[] = []
        const out = new PassThrough()
          .on('data', (chunk) => chunks.push(Buffer.from(chunk)))
          .on('end', () => resolve(Buffer.concat(chunks).toString()))
        pipeline(
          ndjsonData,
          toMessageStream,
          new CucumberHtmlStream(
            __dirname + '/../dist/main.css',
            __dirname + '/../dist/main.js'
          ),
          out,
          (err: Error) => {
            if (err) {
              reject(err)
            }
          }
        )
      })
      const dir = path.join(__dirname, 'examples', 'cck', example)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      const actualScreenshotPath = path.join(dir, `${example}.actual.png`)
      await renderHtml(htmlData.toString(), async (page) => {
        await page.screenshot({
          path: actualScreenshotPath,
          fullPage: true,
        })
      })

      const actualScreenshot = PNG.sync.read(
        fs.readFileSync(actualScreenshotPath)
      )
      const expectedScreenshotPath = path.join(dir, `${example}.expected.png`)
      const expectedScreenshot = PNG.sync.read(
        fs.readFileSync(expectedScreenshotPath)
      )
      const { width, height } = expectedScreenshot
      const diff = new PNG({ width, height })
      const pixels = pixelmatch(
        actualScreenshot.data,
        expectedScreenshot.data,
        diff.data,
        width,
        height,
        {
          threshold: 0.1,
        }
      )
      const diffScreenshotPath = path.join(dir, `${example}.diff.png`)
      fs.writeFileSync(diffScreenshotPath, PNG.sync.write(diff))
      assert.ok(
        pixels == 0,
        `Screenshot of rendered browser did not look as expected.
actual:   ${actualScreenshotPath}
expected: ${expectedScreenshotPath}
diff:     ${diffScreenshotPath}`
      )
    })
  }
})
