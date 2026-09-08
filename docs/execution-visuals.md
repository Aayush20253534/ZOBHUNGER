# Branded execution visuals — Part 3

This asset set illustrates how ZOBHUNGER field teams perform six service activities.
The images were created with the built-in image-generation tool, using fictional
people and illustrative market situations. They are not photographs or evidence
of a completed client engagement.

## Included scenes

| Catalog key | What the scene shows | Suggested placement |
| --- | --- | --- |
| `survey` | A researcher listening to a shopper and recording a questionnaire | Surveys, market research, consumer-survey case study |
| `audit` | An auditor checking shelves and capturing photo evidence | Retail execution, audit articles, retail-audit case study |
| `seller-onboarding` | A shop owner getting help with online product listings | Seller acquisition, onboarding guides, marketplace case study |
| `qr-deployment` | A QR display being installed and checked with the merchant | Merchant acquisition, digital-payment deployment case study |
| `sampling` | A promoter approaching a shopper and handing over a sealed sample | Brand activation, sampling articles, product-sampling case study |
| `field-executives` | Field executives explaining a card-service offering and capturing an enquiry | Homepage hero, field sales, customer-outreach stories |

## Files and image sizes

- Assets: `client/public/images/execution/`.
- Each scene has `-600.webp`, `-1200.webp`, and `-1536.webp` variants.
- Dimensions are 600 × 400, 1200 × 800, and 1536 × 1024. All keep the original 3:2 composition.
- Images are encoded as WebP at quality 82, with no additional creative retouching.
- Asset catalog: `client/src/data/execution-visuals.ts`.
- Shared component: `client/src/components/common/ExecutionImage.tsx`.
- Styles: `client/src/styles/execution-image.css`.
- Each catalog entry includes a title, descriptive alt text, a caption and three activity steps.

The homepage hero consumes the field-executive asset through the shared component.
Parts 4–7 use these scenes across the homepage, service stories, blogs and case
studies. Part 7 extends the image set and replaces the earlier hero entrance with
a longer sequence and controllable continuous motion.

## Reuse

```tsx
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { executionVisuals } from "@/data/execution-visuals";

const visual = executionVisuals.sampling;

<figure>
  <ExecutionImage
    visual={visual}
    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
  />
  <figcaption>{visual.caption}</figcaption>
</figure>
```

Use a `sizes` value that matches the actual layout. The browser selects one
image from `srcSet`; it does not need to download all three variants. By default
the component lazy-loads. Set `priority` only for an image above the fold, as the
homepage does. Intrinsic dimensions and a fixed aspect ratio reserve its space.
The component is server-rendered and needs no image API, client-side gallery
library, API key or runtime image-generation service.

The component includes a visible “AI-generated scene” label. Keep that distinction
when using the assets alongside case studies. Use verified client photographs and
results separately when supplied. The QR artwork is illustrative, not a payment
destination, and the generic card brochure does not advertise actual rates or terms.

## Generation prompts

Mode: built-in image generation; one independently generated landscape per scene.
No reference image was supplied to generation. Uniforms use the exact wordmark
“ZOBHUNGER” in white on a deep-red polo; the existing logo files are unchanged.

Every scene used the following common prompt, followed by its individual scene prompt.

### Common prompt

Use case: photorealistic-natural.
Asset type: a landscape website service illustration for ZOBHUNGER, a workforce and field execution company in India.
Create ONE individual 1536 by 1024 landscape photograph, 3:2 aspect ratio, edge-to-edge, with no frames, collages, captions, overlays or watermarks.
Style: premium candid documentary photography, natural Indian market environment, warm neutral daylight, true skin texture, realistic anatomy and hands, believable depth and subtle background activity. Eye-level 35mm framing, show the interaction clearly, keep the important faces and hands within the middle 80% of the frame for responsive cropping.
Uniform continuity across this series: executives wear clean deep-red short-sleeve polo shirts, charcoal trousers, and a simple dark lanyard with an anonymous ID badge. Embroider the exact white uppercase word "ZOBHUNGER" on the left chest, spelled Z-O-B-H-U-N-G-E-R, readable and correctly spelled. Customers and merchants wear everyday clothes. No other logos or brand names. Use fictional adults, never recognizable real people. No fabricated statistics, readable personal documents, payment credentials or sensitive personal data. No futuristic holograms, glossy corporate office staging, or people posing at the camera.

### Consumer survey

Primary scene: A female field researcher in the red ZOBHUNGER polo is conducting a voluntary consumer survey beside an Indian neighbourhood grocery shop. She stands to the left, listening attentively to an adult woman shopper on the right, holding a tablet at a natural angle and recording a response with one finger. Show a simple anonymous questionnaire layout on the tablet with no legible personal answers. The shopper gestures lightly while responding, with a reusable shopping bag at her side. Retail displays and a few passers-by establish the local market setting. The moment must clearly communicate asking a question, listening, and capturing a response.

### Retail audit

Primary scene: Inside a tidy Indian neighbourhood supermarket, a male field auditor in the red ZOBHUNGER polo compares an eye-level grocery shelf with a checklist on a tablet. His other hand holds a smartphone directed at the shelf to capture product placement evidence. A shopkeeper in an ordinary light blue shirt stands beside him watching the check. Show believable shelf rows, generic packages and a visible empty shelf slot being inspected; no readable third-party branding. Frame the two people and the product shelf together so it immediately reads as an in-store availability and display audit, not a purchase or a posed portrait.

### Seller onboarding

Primary scene: At the counter of a small Indian homewares and textiles shop, a female ZOBHUNGER field executive in the red uniform explains an online seller registration process to a middle-aged male shop owner in everyday clothing. An open laptop between them shows a clean generic product-listing screen with thumbnail tiles and form fields but no readable personal information. The executive points at the laptop and the shop owner uses the trackpad. A phone, neatly stacked folded cloth and small packaged products establish an active real shop. Capture a patient hands-on demonstration, onboarding assistance and the merchant learning to list products; no money changing hands.

### QR deployment

Primary scene: Inside a small Indian kirana store near its entrance, a male ZOBHUNGER field executive in the red uniform carefully places a white countertop QR payment display beside the checkout. The stand carries an illustrative black-and-white QR-like pattern only, no actual payment address, no bank logo or payment brand. A female merchant in everyday clothing points a smartphone camera toward the newly placed stand while the executive explains the test scan. Show both people, the stand and the phone clearly. Behind them are believable generic grocery shelves. The action should immediately communicate installing the QR display, explaining its use to the merchant, and checking the scan.

### Market sampling

Primary scene: In a welcoming Indian outdoor retail market, a female ZOBHUNGER promoter in the red polo and charcoal trousers has approached an adult shopper and is handing her one small sealed generic food sample sachet. The shopper is naturally reaching to accept it. The promoter holds a neat tray of identical sealed samples in her other hand and explains the product with a friendly expression. An adult man accompanying the shopper looks on. Keep the handover of the sample large and clear in the centre, show the promoter's correctly spelled chest wordmark, and show the market storefronts and pedestrians in soft background focus. No open food, disposable-cup tasting, brand logos, aggressive sales pose or forced interaction. This must clearly read as approaching a customer and distributing samples in the market.

### Card and field executives

Primary scene: At the entrance to a busy Indian neighbourhood retail market, two ZOBHUNGER field executives, one woman and one man in matching red polos and dark trousers, are helping an adult customer understand a generic card-service offering. The female executive shows an open brochure with a simple unbranded blank sample card illustration and neutral graphic blocks, with no rates, promises, numbers or readable fine print. The male executive holds a tablet ready to record the enquiry and listens. The customer in everyday clothing asks a question and points to the brochure. Show actual respectful product explanation and field lead capture, not a team portrait. Their ZOBHUNGER uniforms and practical market surroundings should immediately convey trained field staff working with customers on the ground.


## Part 7 additions: service covers and case-study scenes

Mode: built-in image generation, five independent new landscape scenes, without
reference images. The results were visually inspected for the work interaction,
faces, hands and the ZOBHUNGER wordmark. No creative edits were made after generation.
Sharp converted each image to the same three WebP sizes at quality 82, effort 6.
The five additions total approximately 1.05 MiB across all 15 variants; a 600px
variant is approximately 29–40 KB. Original PNGs are not needed at runtime.

| Catalog key | Placement | Asset paths (under `client/public/images/execution/`) |
| --- | --- | --- |
| `workforce-hiring` | Workforce recruitment | `workforce-hiring-600.webp`, `workforce-hiring-1200.webp`, `workforce-hiring-1536.webp` |
| `operations-coordination` | Operations coordination | `operations-coordination-600.webp`, `operations-coordination-1200.webp`, `operations-coordination-1536.webp` |
| `product-demonstration` | In-store product demonstration | `product-demonstration-600.webp`, `product-demonstration-1200.webp`, `product-demonstration-1536.webp` |
| `last-mile-delivery` | Delivery workforce | `last-mile-delivery-600.webp`, `last-mile-delivery-1200.webp`, `last-mile-delivery-1536.webp` |
| `mobility-onboarding` | Mobility partner onboarding | `mobility-onboarding-600.webp`, `mobility-onboarding-1200.webp`, `mobility-onboarding-1536.webp` |

The service catalogue uses explicit cover mappings in
`client/src/data/solution-cover-visuals.ts`. Recruitment, operations and gig-workforce
articles now use the new scenes; the other article covers retain the relevant
field-sales, retail and sampling scenes from Part 3. All eight case studies use
activity-specific photographs through `client/src/data/case-study-visuals.ts`.

### Part 7 common prompt

Use case: photorealistic-natural.
Asset type: professional ZOBHUNGER website service-card, blog and case-study cover.
Create a polished but candid editorial photograph, landscape 1536x1024, of fictional adult Indian people doing real work. Natural daylight, believable Indian working environment, crisp faces and hands, realistic skin and fabric textures, warm neutral setting with burgundy accents. All ZOBHUNGER staff wear neat deep burgundy-red polo shirts with the small exact white embroidered uppercase word "ZOBHUNGER" on the left chest (Z O B H U N G E R), charcoal trousers and a simple dark lanyard with anonymous ID. Other people wear ordinary appropriate clothing. Wide balanced composition, all essential faces, uniforms and the work interaction fit comfortably in the middle horizontal band for responsive cover cropping; keep extra space above heads and below hands. People focused on the task, natural body language, no staged handshake or posing at camera. No added titles, captions, watermarks, legible personal details, real client logos or invented readable dashboard metrics. No collage, no diagram, no split panels, no glossy 3D rendering.

### Workforce recruitment

Scene: Inside a modest bright Indian recruitment office, a female ZOBHUNGER recruiter talks with an adult male job candidate across a desk. She listens and reviews a simple role checklist on a clipboard; he discusses the assignment and holds a plain document folder. A closed laptop and pen on desk, soft out-of-focus office context. The visible interaction should clearly communicate screening and explaining a workforce assignment, respectful and practical.

### Operations coordination

Scene: At a bright Indian operations office, a female ZOBHUNGER coordinator and a male ZOBHUNGER colleague review field updates together at a laptop. One points to a simple anonymous task list on screen while the other notes the next action beside a tablet. A blurred planning board in the background with simple location pins and no legible numbers. Convey coordination, checking records, assigning follow-up and supporting distributed market teams. Faces and both branded polo chest areas are visible.

### In-store product demonstration

Scene: In a contemporary everyday Indian consumer electronics store, a female ZOBHUNGER in-store promoter demonstrates an unbranded small portable speaker to an adult male shopper at the counter. She points to its controls and explains its features as the shopper listens and tries a button. Clean shelves with unbranded boxed electronics in the background. Focus on the product, the natural interaction, and the clearly readable embroidered company wordmark. No sample food, no crowd.

### Delivery workforce

Scene: At an Indian neighbourhood parcel dispatch point, a male ZOBHUNGER field coordinator scans a generic barcode label on a sealed brown parcel while handing it to an adult delivery rider in a plain dark work jacket. The rider's helmet is worn with visor up or held safely; a stationary delivery scooter and neat parcel racks appear in the background. Both people are safely standing, focused on the handover. No moving vehicle, no identifiable address, no delivery-platform logos. Convey parcel handover and preparing a delivery assignment.

### Mobility partner onboarding

Scene: Outside a small Indian mobility partner support point, a female ZOBHUNGER onboarding executive helps an adult male prospective rider understand a simple registration form on a tablet. The rider holds a plain helmet and stands beside his safely parked scooter; the executive points at a form field while explaining the process. A modest street-side office in background, no legible shop names. Make the tablet guidance and rider onboarding unmistakable, with natural focused expressions, the embroidered company wordmark visible, no parcel boxes and no moving vehicle.
