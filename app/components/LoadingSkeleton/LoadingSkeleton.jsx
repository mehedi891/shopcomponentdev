
// eslint-disable-next-line react/prop-types
const LoadingSkeleton = ({ pageSize = 'base' }) => {
    return (
        // <s-page
        //     inlinesize={pageSize}
        // >
        //     <div
        //         style={{ width: '100%', height: '100vh', background: '#f4f4f4', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        //     >
        //         <s-stack

        //             justifyContent="center"
        //             alignItems="center"

        //         >
        //             <s-spinner accessibilityLabel="Loading" size="large-100" />
        //         </s-stack>
        //     </div>
        // </s-page>

        <s-page inlineSize={pageSize}>
            <s-query-container>
                <s-box paddingBlockStart="large">
                    <s-section>
                        <s-stack gap="base">
                            <s-box borderRadius="base" background="strong" blockSize="40px" inlineSize="150px"></s-box>
                            <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="100%"></s-box>
                            <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="100%"></s-box>
                            <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="80%"></s-box>
                        </s-stack>
                    </s-section>
                </s-box>

                <s-grid
                    paddingBlockStart="large-200"
                    gap="large"
                    gridTemplateColumns="@container(inline-size < 500px) 1fr, 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr"
                >
                    <s-grid-item gridColumn="span 8">
                        <s-section>
                            <s-stack gap="base">
                                <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="100%"></s-box>
                                <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="100%"></s-box>
                                <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="100%"></s-box>
                                <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="80%"></s-box>
                            </s-stack>
                        </s-section>


                        <s-box paddingBlockStart="large">
                            <s-section>
                                <s-stack gap="base">
                                    <s-box borderRadius="base" background="strong" blockSize="40px" inlineSize="150px"></s-box>
                                    <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="100%"></s-box>
                                    <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="100%"></s-box>
                                    <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="80%"></s-box>
                                </s-stack>
                            </s-section>
                        </s-box>


                        <s-box paddingBlockStart="large">
                            <s-section>
                                <s-stack gap="base">
                                    <s-box borderRadius="base" background="strong" blockSize="40px" inlineSize="150px"></s-box>
                                    <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="100%"></s-box>
                                    <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="100%"></s-box>
                                    <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="80%"></s-box>
                                </s-stack>
                            </s-section>
                        </s-box>

                    </s-grid-item>

                    <s-grid-item gridColumn="span 4">
                        <s-section>
                            <s-stack gap="base">
                                <s-box borderRadius="base" background="strong" blockSize="40px" inlineSize="150px"></s-box>
                                <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="100%"></s-box>
                                <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="80%"></s-box>
                                <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="100%"></s-box>
                            </s-stack>

                        </s-section>
                        <s-box paddingBlockStart="large">
                            <s-section>
                                <s-stack gap="base">
                                    <s-box borderRadius="base" background="strong" blockSize="40px" inlineSize="150px"></s-box>
                                    <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="100%"></s-box>
                                    <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="80%"></s-box>
                                    <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="100%"></s-box>
                                    <s-box borderRadius="small" background="strong" blockSize="15px" inlineSize="80%"></s-box>
                                </s-stack>
                            </s-section>
                        </s-box>
                    </s-grid-item>
                </s-grid>

            </s-query-container>
        </s-page>
    )
}

export default LoadingSkeleton