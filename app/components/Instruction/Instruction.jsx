

const Instruction = () => {
  


  return (
    <s-banner heading="How to Create & Embed Your Component" tone="info" dismissible>

      <s-modal id="video-tutorial-modal-instruction" heading="Video Tutorial">
        <iframe width="100%" height="400px" src="https://www.youtube.com/embed/j3Br-xr-mps" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
      </s-modal>

      <s-grid
        gridTemplateColumns="@container (inline-size < 500px) 1fr,1fr 1fr"
        gap="base"
        alignItems="center"
      >

        <s-stack
          background="subdued"
          padding="small-300 small"
          borderRadius="large"
        >
          <s-ordered-list>
            <s-list-item>
              <s-stack>
                <s-text type="strong">Create a component</s-text>
                <s-text>Select your desired products,collections,and layout. <s-link
                  href="https://embedup.com/academy/how-to-display-your-store-products-on-other-websites-outside-of-shopify/"
                  target="_blank"
                >[See how →]</s-link></s-text>
              </s-stack>
            </s-list-item>
            <s-list-item>
              <s-stack>
                <s-text type="strong">Customize settings</s-text>
                <s-text>Adjust design, and options to match your store’s needs.</s-text>
              </s-stack>
            </s-list-item>
            <s-list-item>
              <s-stack>
                <s-text type="strong">Save your component</s-text>
                <s-text>Your component is now ready to use.</s-text>
              </s-stack>
            </s-list-item>

            <s-list-item>
              <s-stack>
                <s-text type="strong">Copy the embed code</s-text>
                <s-text>One click to copy your unique code snippet.</s-text>
              </s-stack>
            </s-list-item>

            <s-list-item>
              <s-stack>
                <s-text type="strong">Embed anywhere</s-text>
                <s-text>Paste the code into your external website, blog, or landing page.</s-text>
              </s-stack>
            </s-list-item>


          </s-ordered-list>
        </s-stack>

        <s-link
          commandFor="video-tutorial-modal-instruction"
          command="--show"
        >
          <s-image
            src="/images/demo_video_f.webp"
            alt="Demo"
            loading="lazy"
            borderRadius="large"
            aspectRatio="16/8"
            inlineSize="fill"
            objectFit="contain"
          />
        </s-link>
      </s-grid>

    </s-banner>
  )
}

export default Instruction