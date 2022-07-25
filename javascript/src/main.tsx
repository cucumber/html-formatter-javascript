import './styles.scss'

import { Envelope } from '@cucumber/messages'
import { components, searchFromURLParams } from '@cucumber/react-components'
import React, { useState } from 'react'
import ReactDOM from 'react-dom'

const { CucumberReact } = components
const { FilteredResults, EnvelopesWrapper, SearchWrapper } = components.app

declare global {
  interface Window {
    p(envelope: Envelope): void
  }
}

const App: React.FunctionComponent = () => {
  const [envelopes, setEnvelopes] = useState<readonly Envelope[]>([])
  window.p = (envelope) => setEnvelopes(envelopes.concat(envelope))

  return (
    <CucumberReact theme="auto">
      <EnvelopesWrapper envelopes={envelopes}>
        <SearchWrapper {...searchFromURLParams()}>
          <FilteredResults className="html-formatter" />
        </SearchWrapper>
      </EnvelopesWrapper>
    </CucumberReact>
  )
}

ReactDOM.render(<App />, document.getElementById('content'))
