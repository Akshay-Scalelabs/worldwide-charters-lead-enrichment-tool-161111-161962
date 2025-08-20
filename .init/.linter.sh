#!/bin/bash
cd /home/kavia/workspace/code-generation/worldwide-charters-lead-enrichment-tool-161111-161962/LeadEnrichmentFrontendWebApp
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

