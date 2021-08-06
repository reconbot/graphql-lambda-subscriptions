// tslint:disable: no-console
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor'

const config = ExtractorConfig.loadFileAndPrepare('./api-extractor.json')

// This interface provides additional runtime state that is NOT part of the config file
const options = {
  // localBuild: process.argv.indexOf("--ship") < 0
}
const extractorResult = Extractor.invoke(config, options)
if (extractorResult.succeeded) {
  console.log('API Extractor completed successfully')
} else {
  console.error(
    `API Extractor completed with ${extractorResult.errorCount} errors` +
      ` and ${extractorResult.warningCount} warnings`,
  )
  process.exit(1)
}
