# Brand Compass

https://github.com/ShadowRealm15/brand-compass-visage import this project as it is then apply these points                                         In the Gemini API service file, update the prompt payload string variable to this exact structure:

"Generate a comprehensive, high-energy digital brand strategy deck as a clean JSON object. Maintain a distinct, modern tone without using generic corporate clichés.

Strictly enforce this JSON schema:

1. 'Executive Summary': 2 vivid sentences detailing the brand's core mission and the legacy industry narrative being disrupted.

2. 'Audience Empathy': An object containing:

   - 'Pain': 1-2 sentences describing the customer's current frustration, fatigue, or routine limitation.

   - 'Dream': 1-2 sentences describing their ideal, liberating outcome.

3. 'Strategic Positioning': The unique brand angle in 1-2 concise sentences (keep title short).

4. 'Hero Messaging': An array of 3 memorable, high-impact headlines using strong action verbs.

5. 'Visual Identity': An object containing:

   - 'Colors': An array of 3 high-contrast modern Hex codes.

   - 'Typography': An object with 'Display' (suggested display font) and 'Body' (suggested body font).

   - 'ArtDirection': 1 evocative sentence defining photography, lighting, or 3D visual styling for creative teams.

   - 'Sliders': An array of 3 design tone scales formatted strictly as 'Category: X/10'.

6. 'Action Plan': An array of 3 concise, actionable directives (keep under 25 words each to avoid layout clipping):

   - Directive 1: A specific CSS/React UI motion specification (e.g., Framer Motion hover/scroll physics with scale/easing values).

   - Directive 2: A copywriting guideline formatted strictly as 'Reframe copy from [Technical Before text] to [High-energy After text]'.

   - Directive 3: A concrete interactive web component or calculator concept.

Return raw valid JSON only. Do not include markdown formatting or backticks."

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/01bc5f9e-31c0-41b2-ace6-2d844199faa4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
