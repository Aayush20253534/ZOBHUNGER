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

The homepage hero now consumes the field-executive asset through the shared
component. The existing Part 2 entrance animation still applies to its figure.
The other scenes are ready for the homepage, service, blog and case-study layouts
in the following parts. Creating the assets does not insert those layouts yet.

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
