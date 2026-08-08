import re

with open('src/components/discovery-v2/stages/Stage2SimilarChannels.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ADD IMPORTS
if 'Accordion' not in content:
    content = content.replace('import { Input } from \"@/components/ui/input\";', 'import { Input } from \"@/components/ui/input\";\nimport { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from \"@/components/ui/accordion\";\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from \"@/components/ui/select\";')


print("Done")
