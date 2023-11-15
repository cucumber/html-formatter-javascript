# frozen_string_literal: true

require 'cucumber/messages'
require 'cucumber/html_formatter'

describe Cucumber::HTMLFormatter::Formatter do
  subject(:formatter) do
    formatter = Cucumber::HTMLFormatter::Formatter.new(out)
    allow(formatter).to receive(:assets_loader).and_return(assets)
    formatter
  end

  let(:out) { StringIO.new }
  let(:fake_assets) do
    Class.new do
      def template
        "<html>{{css}}<body>{{messages}}</body>{{script}}</html>"
      end

      def css
        "<style>div { color: red }</style>"
      end

      def script
        "<script>alert('Hi')</script>"
      end
    end
  end
  let(:assets) { fake_assets.new }

  context '.write_pre_message' do
    it 'outputs the content of the template up to {{messages}}' do
      formatter.write_pre_message()
      expect(out.string).to eq("<html>\n<style>div { color: red }</style>\n<body>\n")
    end

    it 'does not write the content twice' do
      formatter.write_pre_message()
      formatter.write_pre_message()

      expect(out.string).to eq("<html>\n<style>div { color: red }</style>\n<body>\n")
    end
  end

  context '.write_message' do
    let(:message) do
      ::Cucumber::Messages::Envelope.new(
        pickle: ::Cucumber::Messages::Pickle.new(id: 'some-random-uid')
      )
    end

    it 'appends the message to out' do
      formatter.write_message(message)
      expect(out.string).to eq(message.to_json)
    end

    it 'adds commas between the messages' do
      formatter.write_message(message)
      formatter.write_message(message)

      expect(out.string).to eq("#{message.to_json},\n#{message.to_json}")
    end
  end

  context '.write_post_message' do
    it 'outputs the template end' do
      formatter.write_post_message()
      expect(out.string).to eq("</body>\n<script>alert('Hi')</script>\n</html>")
    end
  end

  context '.process_messages' do
    let(:message) do
      ::Cucumber::Messages::Envelope.new(
        pickle: ::Cucumber::Messages::Pickle.new(id: 'some-random-uid')
      )
    end

    it 'produces the full html report' do
      formatter.process_messages([message])
      expect(out.string).to eq([
        '<html>',
        '<style>div { color: red }</style>',
        '<body>',
        "#{message.to_json}</body>",
        "<script>alert('Hi')</script>",
        '</html>'
      ].join("\n"))
    end
  end
end
