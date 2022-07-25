import * as messages from '@cucumber/messages'
import assert from 'assert'
import { Writable } from 'stream'

import CucumberHtmlStream from '../src/CucumberHtmlStream'

async function renderAsHtml(
  ...envelopes: messages.Envelope[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = ''
    const sink: Writable = new Writable({
      write(
        chunk: string,
        _: string,
        callback: (error?: Error | null) => void
      ): void {
        html += chunk
        callback()
      },
    })
    sink.on('finish', () => resolve(html))
    const cucumberHtmlStream = new CucumberHtmlStream(
      `${__dirname}/dummy.css`,
      `${__dirname}/dummy.js`
    )
    cucumberHtmlStream.on('error', reject)
    cucumberHtmlStream.pipe(sink)

    for (const envelope of envelopes) {
      cucumberHtmlStream.write(envelope)
    }
    cucumberHtmlStream.end()
  })
}

describe('CucumberHtmlStream', () => {
  it('writes one message to html', async () => {
    const e1: messages.Envelope = {
      testRunStarted: {
        timestamp: { seconds: 0, nanos: 0 },
      },
    }
    const html = await renderAsHtml(e1)
    assert(html.indexOf(`p(${JSON.stringify(e1)})`) >= 0)
  })

  it('writes two messages to html', async () => {
    const e1: messages.Envelope = {
      testRunStarted: {
        timestamp: { seconds: 0, nanos: 0 },
      },
    }
    const e2: messages.Envelope = {
      testRunFinished: {
        timestamp: { seconds: 0, nanos: 0 },
        success: true,
      },
    }
    const html = await renderAsHtml(e1, e2)
    console.log(html)
    assert(html.indexOf(`<script>p(${JSON.stringify(e1)});</script>`) >= 0)
    assert(html.indexOf(`<script>p(${JSON.stringify(e2)});</script>`) >= 0)
  })
})
