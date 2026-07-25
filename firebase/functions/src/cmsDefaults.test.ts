import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SELLER_WELCOME_TEMPLATE,
  isSellerWelcomeTemplate,
  renderCmsTemplate,
} from "./cmsDefaults";

test("seller welcome bootstrap content is valid and renders only supplied fields", () => {
  assert.equal(isSellerWelcomeTemplate(DEFAULT_SELLER_WELCOME_TEMPLATE), true);
  const rendered = renderCmsTemplate(
    DEFAULT_SELLER_WELCOME_TEMPLATE.text,
    {
      fullName: "Artist Name",
      studioName: "Atelier",
      studioUrl: "/studio/atelier",
      dashboardUrl: "/studio-admin/overview",
    },
  );
  assert.match(rendered, /Artist Name/);
  assert.match(rendered, /Atelier/);
  assert.doesNotMatch(rendered, /{{/);
});
