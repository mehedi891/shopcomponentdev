import { useActionData, useLoaderData, useNavigate, useNavigation, useSubmit } from "@remix-run/react";
import { BlockStack, Box, Button, Card, Checkbox, Collapsible, Divider, Icon, InlineError, InlineStack, Layout, Page, RadioButton, Select, Tabs, Text, TextField, Thumbnail } from "@shopify/polaris"
import {
    CaretDownIcon,
    DeleteIcon,
    SearchIcon,
    XIcon
} from '@shopify/polaris-icons';
import { useTranslation } from "react-i18next"
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { Controller, useForm } from "react-hook-form";
import { useCallback, useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { limitTotalVariants } from "../utilis/limitVariants";
import { authenticate } from "../shopify.server";
import crypto from "crypto";


export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);

    const trackingCode = crypto.randomBytes(15).toString("base64url").slice(0, 10).toUpperCase();

    return {
        trackingCode: trackingCode
    }
}

const CreateComponent = () => {
    const { trackingCode } = useLoaderData();
    const [titleAndDescToggleOpen, setTitleAndDescToggleOpen] = useState(true);
    const [appliesToOpen, setAppliesToOpen] = useState(false);
    const [chooseProductOpen, setChooseProductOpen] = useState(true);
    const [layoutOpen, setLayoutOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [tranckingOpen, setTranckingOpen] = useState(false);
    const [selectedProductsInd, setSelectedProductsInd] = useState([]);
    const [selectedProductsBulk, setSelectedProductsBulk] = useState([]);
    const [settingsTabSelected, setSettingsTabSelected] = useState(0);
    const [checkMaxSelectedVariants, setCheckMaxSelectedVariants] = useState(false);
    const navigation = useNavigation();
    const navigate = useNavigate();
    const actionData = useActionData();
    const shopify = useAppBridge();

    const submit = useSubmit();
    const { t } = useTranslation();

    const { register, handleSubmit, reset, formState: { errors, isDirty }, control, watch, setValue } = useForm({
        defaultValues: {
            title: '',
            description: '',
            appliesTo: 'product',
            addToCartType: {
                type: 'individual',
                products: []
            },
            enableQtyField: false,
            layout: 'list',
            status: 'activate',
            tracking: trackingCode,
        }
    });
    const watchedValues = watch();

    useEffect(() => {
        if (watchedValues.addToCartType.type === 'individual') {
            setValue('addToCartType.products', selectedProductsInd);
        } else if (watchedValues.addToCartType.type === 'bulk') {
            setValue('addToCartType.products', selectedProductsBulk);
        }

    }, [selectedProductsInd, selectedProductsBulk, watchedValues.addToCartType.type, setValue]);

    const formHandleSubmit = (data) => {
        const updatedWithShop = { ...data };
        console.log(updatedWithShop);
        //submit(updatedWithShop, { method: 'post' });
    };

    const handleChooseProductsInd = async (query) => {
        const selected = await shopify.resourcePicker({
            type: 'product',
            multiple: 3,
            selectionIds: selectedProductsInd.length > 0 ? selectedProductsInd.map(product => {
                return {
                    id: product.id
                }
            }) : [],
            filter: { variants: false, archived: false, draft: false },
            action: "select",
            query: query
        });
        if (selected) {
            setSelectedProductsInd(() => {
                const selectedProducts = selected.map(product => {
                    return { id: product.id, title: product.title, handle: product.handle, image: product.images[0].originalSrc };
                })
                return selectedProducts
            });
        }

    }



    const handleChooseProductsBulk = async (query) => {
        const selected = await shopify.resourcePicker({
            type: 'product',
            multiple: 12,
            query: '',
            selectionIds: selectedProductsBulk?.length > 0 && selectedProductsBulk?.map(item => {
                return {
                    id: item.id,
                    variants: item?.variants?.length > 0 && item?.variants?.map(variant => {
                        return {
                            id: variant.id
                        }
                    })
                }
            }),
            filter: {
                hidden: true,
                variants: true,
                draft: false,
                archived: false,
            },
        });

        if (selected) {
            //console.log('selected', selected);
            setSelectedProductsBulk(limitTotalVariants(selected, 12));
        }

    }

    useEffect(() => {
        if (selectedProductsBulk?.length > 0) {
            const totalVariants = selectedProductsBulk.reduce((sum, product) => {
                return sum + (product.variants?.length || 0);
            }, 0);
            setCheckMaxSelectedVariants(totalVariants >= 10);
            //console.log('selectedProductsBulk', selectedProductsBulk);
        }
    }, [selectedProductsBulk]);

    const handleDeleteProductInd = (id) => {
        setSelectedProductsInd(selectedProductsInd.filter(product => product.id !== id));
    }

    const handleDeleteProductBulk = (id, type) => {
        if (type === 'product') {
            setSelectedProductsBulk(() => {
                return selectedProductsBulk?.filter(item => item.id !== id)
            });
        } else if (type === 'variant') {
            setSelectedProductsBulk((prevSelectedProducts) => {
                return prevSelectedProducts.reduce((acc, product) => {
                    const updatedVariants = product.variants.filter(variant => variant.id !== id);

                    if (updatedVariants.length > 0) {
                        acc.push({
                            ...product,
                            variants: updatedVariants
                        });
                    }

                    return acc;
                }, []);
            });

        }
    }

    const handleChangeQuantityDefault = (id, qtyValue) => {
        setSelectedProductsBulk((prevSelectedProducts) => {
            return prevSelectedProducts.map((product) => {
                const updatedVariants = product.variants.map((variant) => {
                    return {
                        ...variant,
                        quantity: variant.id === id ? qtyValue : variant.quantity
                    };
                });

                return {
                    ...product,
                    variants: updatedVariants
                };
            });
        });
    };

    const settingsTab = [
        {
            id: 'component-settings',
            content: 'Component settings',
            accessibilityLabel: 'Component settings',
            panelID: 'settingsTab-content-1',
        },
        {
            id: 'product-layput',
            content: 'Product Layout',
            accessibilityLabel: 'Product Layout',
            panelID: 'settingsTab-content-2',
        },
        {
            id: 'add-to-cart-btn',
            content: 'Add to cart',
            accessibilityLabel: 'Add to cart',
            panelID: 'settingsTab-content-3',
        },
        {
            id: 'checkout-btn',
            content: 'Checkout',
            accessibilityLabel: 'Checkout',
            panelID: 'settingsTab-content-4',
        },
    ];

    const handleSettingsTabChange = useCallback((selectedTabIndex) => {
        setSettingsTabSelected(selectedTabIndex);
    }, []);

    return (
        navigation.state === "loading" ? <LoadingSkeleton /> :
            <form method="post" onSubmit={handleSubmit(formHandleSubmit)}>
                <Page
                    fullWidth
                    title={t("create_componet")}
                    backAction={{ onAction: () => navigate('/app') }}
                >
                    <Layout>
                        <Layout.Section variant="oneThird">

                            <BlockStack>
                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => { setTitleAndDescToggleOpen(!titleAndDescToggleOpen) }} textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={titleAndDescToggleOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("titleAndDesc")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={titleAndDescToggleOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box padding={'300'}>
                                                <BlockStack gap={'300'}>
                                                    <Controller
                                                        name="title"
                                                        control={control}
                                                        rules={{
                                                            required: t("title_require_msg"), minLength: { value: 4, message: t("title_min_length_msg") },
                                                            maxLength: {
                                                                value: 100,
                                                                message: t("title_max_length_msg")
                                                            }
                                                        }}
                                                        render={({ field, fieldState }) => (
                                                            <TextField
                                                                type="text"
                                                                label={t("title")}
                                                                name="title"
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                error={fieldState.error?.message || actionData?.errors?.title}
                                                                autoComplete="off"
                                                                placeholder={t("enter_title_placeholder")}
                                                                maxLength={100}
                                                                showCharacterCount
                                                                requiredIndicator
                                                            />
                                                        )}
                                                    />

                                                    <Controller
                                                        name="description"
                                                        control={control}
                                                        rules={{
                                                            required: false,
                                                            maxLength: {
                                                                value: 150,
                                                                message: t("description_max_length_msg")
                                                            }
                                                        }}
                                                        render={({ field, fieldState }) => (
                                                            <TextField
                                                                type="text"
                                                                multiline={3}
                                                                label={t("description")}
                                                                name="description"
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                error={fieldState.error?.message || actionData?.errors?.description}
                                                                autoComplete="off"
                                                                placeholder={t("description_placeholder")}
                                                                maxLength={150}
                                                                showCharacterCount

                                                            />
                                                        )}
                                                    />
                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>


                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => { setAppliesToOpen(!appliesToOpen) }} textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={appliesToOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("applies_to")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={appliesToOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box padding={'300'}>
                                                <BlockStack gap={'100'}>
                                                    <Controller
                                                        name="appliesTo"
                                                        control={control}
                                                        defaultValue="product"
                                                        render={({ field }) => (
                                                            <>
                                                                <RadioButton
                                                                    name="appliesTo"
                                                                    label={t("applies_to_collection")}
                                                                    checked={field.value === 'collection'}
                                                                    onChange={() => field.onChange('collection')}
                                                                />
                                                                <RadioButton
                                                                    name="appliesTo"
                                                                    label={t("applies_to_product")}
                                                                    checked={field.value === 'product'}
                                                                    onChange={() => field.onChange('product')}
                                                                />
                                                            </>
                                                        )}
                                                    />

                                                    {watchedValues.appliesTo === "product" &&
                                                        <Box paddingBlockStart={'200'}>
                                                            <Controller
                                                                name="addToCartType.type"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Select
                                                                        label={t("add_to_cart_type")}
                                                                        options={[
                                                                            { label: t("individual_add_to_cart"), value: 'individual' },
                                                                            { label: t("bulk_add_to_cart"), value: 'bulk' },]}
                                                                        selected={field.value}
                                                                        onChange={field.onChange}
                                                                        value={field.value}
                                                                    />
                                                                )}
                                                            />
                                                        </Box>
                                                    }
                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>
                                {watchedValues.appliesTo === "collection" &&
                                    <Box>
                                        Collection
                                    </Box>
                                }
                                {watchedValues.appliesTo === "product" && watchedValues.addToCartType.type === "individual" &&
                                    <Box paddingBlockEnd={'400'}>
                                        <Box background="bg-fill" borderRadius="200">
                                            <Box minHeight="50px">
                                                <div className="collapsibleButtonDiv">
                                                    <Button onClick={() => { setChooseProductOpen(!chooseProductOpen) }} textAlign="left"
                                                        variant="monochromePlain"
                                                        size="large"
                                                        fullWidth
                                                        disclosure={chooseProductOpen ? 'up' : 'down'}
                                                    >
                                                        <Text variant="bodyMd" fontWeight="medium">{t("choose_product")}</Text>
                                                    </Button>
                                                </div>
                                            </Box>

                                            <Collapsible
                                                open={chooseProductOpen}
                                                transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                                expandOnPrint
                                            >
                                                <Box padding={'300'}>
                                                    <InlineStack blockAlign="center" align="space-between">
                                                        <Controller
                                                            name="addToCartType.products"
                                                            control={control}
                                                            rules={{
                                                                validate: (value) => {
                                                                    console.log('v:', value);
                                                                    return value?.length !== 0 ? true : t("product_required_msg");
                                                                }
                                                            }}
                                                            render={({ field, fieldState }) => (
                                                                <input type="hidden"
                                                                    name="addToCartType.products"
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                />

                                                            )}
                                                        />

                                                        <Box width="78%">
                                                            <TextField
                                                                type="text"
                                                                autoSize
                                                                name="productSearchQuery"
                                                                value={''}
                                                                onChange={(value) => { handleChooseProductsInd(value) }}
                                                                autoComplete="off"
                                                                placeholder={t("browse_products")}
                                                                prefix={<Icon source={SearchIcon} />}
                                                            />
                                                        </Box>

                                                        <Button onClick={() => { handleChooseProductsInd('') }} size="large">Browse</Button>
                                                    </InlineStack>
                                                </Box>

                                                {errors?.addToCartType?.products?.message && (
                                                    <Box paddingInlineStart={'300'} >
                                                        <InlineError
                                                            message={errors.addToCartType.products.message}
                                                        />
                                                    </Box>
                                                )}

                                                <Box paddingBlock={'400'} paddingInline={'300'}>
                                                    <BlockStack gap={'300'}>
                                                        {selectedProductsInd?.length > 0 && selectedProductsInd.map((product) => {
                                                            return <InlineStack key={product.id} blockAlign="center" align="space-between">
                                                                <InlineStack blockAlign="center" gap={'200'}>
                                                                    <Thumbnail
                                                                        source={product.image}
                                                                        alt={product.handle}
                                                                        size="small"
                                                                    />
                                                                    <Text fontWeight="medium">{product.title}</Text>
                                                                </InlineStack>
                                                                <Button onClick={() => { handleDeleteProductInd(product.id) }} variant="monochromePlain">
                                                                    <Icon tone="subdued" source={DeleteIcon} />
                                                                </Button>
                                                            </InlineStack>
                                                        })

                                                        }
                                                    </BlockStack>
                                                </Box>
                                            </Collapsible>
                                        </Box>
                                    </Box>
                                }


                                {watchedValues.appliesTo === "product" && watchedValues.addToCartType.type === "bulk" &&
                                    <Box paddingBlockEnd={'400'}>
                                        <Box background="bg-fill" borderRadius="200">
                                            <Box minHeight="50px">
                                                <div className="collapsibleButtonDiv">
                                                    <Button onClick={() => { setChooseProductOpen(!chooseProductOpen) }} textAlign="left"
                                                        variant="monochromePlain"
                                                        size="large"
                                                        fullWidth
                                                        disclosure={chooseProductOpen ? 'up' : 'down'}
                                                    >
                                                        <Text variant="bodyMd" fontWeight="medium">{t("choose_product")}</Text>
                                                    </Button>
                                                </div>
                                            </Box>

                                            <Collapsible
                                                open={chooseProductOpen}
                                                transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                                expandOnPrint
                                            >
                                                <Box padding={'300'}>
                                                    <InlineStack blockAlign="center" align="space-between">
                                                        <Controller
                                                            name="addToCartType.products"
                                                            control={control}
                                                            rules={{
                                                                validate: (value) => {
                                                                    //console.log('v:', value);
                                                                    return value?.length !== 0 ? true : t("product_required_msg");
                                                                }
                                                            }}
                                                            render={({ field, fieldState }) => (
                                                                <input type="hidden"
                                                                    name="addToCartType.products"
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                />

                                                            )}
                                                        />

                                                        <Box width="78%">
                                                            <TextField
                                                                type="text"
                                                                autoSize
                                                                name="productSearchQuery"
                                                                value={''}
                                                                onChange={(value) => { handleChooseProductsBulk(value) }}
                                                                autoComplete="off"
                                                                placeholder={t("browse_products")}
                                                                prefix={<Icon source={SearchIcon} />}
                                                            />
                                                        </Box>

                                                        <Button onClick={() => { handleChooseProductsBulk('') }} size="large">Browse</Button>
                                                    </InlineStack>

                                                </Box>

                                                {errors?.addToCartType?.products?.message && (
                                                    <Box paddingInlineStart={'300'} >
                                                        <InlineError
                                                            message={errors.addToCartType.products.message}
                                                        />
                                                    </Box>
                                                )}

                                                <Box paddingBlockStart={'200'} paddingInline={'300'}>
                                                    <Box background="bg-surface-caution" borderRadius="200" padding={'200'}>
                                                        <Text variant="bodySm">{t("product_max_limit_msg")}</Text>
                                                    </Box>
                                                </Box>

                                                <Box paddingBlock={'400'} paddingInline={'300'}>
                                                    <BlockStack gap={'400'}>

                                                        {selectedProductsBulk?.length > 0 && selectedProductsBulk.map((product) => (
                                                            <Box key={product.id}>
                                                                <InlineStack align="space-between" blockAlign="center">
                                                                    <InlineStack gap={'200'} blockAlign="center">
                                                                        <Thumbnail size="small" source={product?.image ? product?.image : 'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png'}
                                                                            alt={product.handle} />
                                                                        <Text variant="bodyMd" fontWeight="medium">{product.title}</Text>
                                                                    </InlineStack>
                                                                    <Button size="large" variant="monochromePlain" onClick={() => { handleDeleteProductBulk(product.id, 'product') }}>
                                                                        <Icon tone="subdued" source={DeleteIcon} />
                                                                    </Button>
                                                                </InlineStack>

                                                                {product?.variants?.length > 0 && product?.variants.map((variant) => (
                                                                    <Box key={variant.id} paddingBlockStart={'200'} paddingBlockEnd={'200'} paddingInlineStart={'400'} >

                                                                        <InlineStack align="center" blockAlign="center" gap={'200'}>
                                                                            <Thumbnail size="small" source={variant?.image ? variant.image : 'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png'}
                                                                                alt={variant.title} />

                                                                            <BlockStack gap={'100'}>

                                                                                <Box paddingInline={'100'}>
                                                                                    <InlineStack align="space-between" blockAlign="center">
                                                                                        <Text variant="bodySm">{variant.title}</Text>

                                                                                        <Button size="medium" variant="monochromePlain" onClick={() => { handleDeleteProductBulk(variant.id, 'variant') }} >
                                                                                            <Icon tone="subdued" source={XIcon} />
                                                                                        </Button>
                                                                                    </InlineStack>
                                                                                </Box>
                                                                                <TextField
                                                                                    label='Quantity'
                                                                                    labelHidden
                                                                                    value={variant.quantity || 0}
                                                                                    onChange={(value) => { handleChangeQuantityDefault(variant.id, value) }}
                                                                                    align="center"
                                                                                    size="slim"
                                                                                    type="number"
                                                                                    min={1}
                                                                                    disabled={watchedValues?.enableQtyField === true ? true : false}
                                                                                />

                                                                            </BlockStack>

                                                                        </InlineStack>
                                                                    </Box>
                                                                ))

                                                                }

                                                                <Divider />
                                                            </Box>



                                                        ))


                                                        }
                                                        <Box borderRadius="100" padding={'400'} background="bg-surface-secondary">
                                                            <Controller
                                                                name="enableQtyField"
                                                                control={control}

                                                                render={({ field }) => (
                                                                    <BlockStack gap="200">
                                                                        <Checkbox
                                                                            label={t("fixed_qty")}
                                                                            checked={field.value === false}
                                                                            onChange={() => field.onChange(false)}
                                                                        />
                                                                        <Checkbox
                                                                            label={t("enable_qty_field")}
                                                                            checked={field.value === true}
                                                                            onChange={() => field.onChange(true)}
                                                                        />
                                                                    </BlockStack>
                                                                )}
                                                            />

                                                        </Box>
                                                    </BlockStack>
                                                </Box>
                                            </Collapsible>
                                        </Box>
                                    </Box>
                                }

                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => { setLayoutOpen(!layoutOpen) }} textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={layoutOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("layout_preview")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={layoutOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box padding={'300'}>
                                                <BlockStack gap={'100'}>
                                                    <Controller
                                                        name="layout"
                                                        control={control}
                                                        defaultValue="list"
                                                        render={({ field }) => (
                                                            <>
                                                                <RadioButton
                                                                    name="layout"
                                                                    label={t("list")}
                                                                    checked={field.value === 'list'}
                                                                    onChange={() => field.onChange('list')}

                                                                />
                                                                <RadioButton
                                                                    name="layout"
                                                                    label={t("grid")}
                                                                    checked={field.value === 'grid'}
                                                                    onChange={() => field.onChange('grid')}

                                                                />
                                                                <RadioButton
                                                                    name="layout"
                                                                    label={t("grid_slider")}
                                                                    checked={field.value === 'gridSlider'}
                                                                    onChange={() => field.onChange('gridSlider')}

                                                                />
                                                            </>
                                                        )}
                                                    />
                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>

                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => { setStatusOpen(!statusOpen) }} textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={statusOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("status")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={statusOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box padding={'300'}>
                                                <BlockStack gap={'100'}>
                                                    <Controller
                                                        name="status"
                                                        control={control}
                                                        defaultValue="active"
                                                        render={({ field }) => (
                                                            <>
                                                                <RadioButton
                                                                    name="status"
                                                                    label={t("activate")}
                                                                    checked={field.value === 'activate'}
                                                                    onChange={() => field.onChange('activate')}

                                                                />
                                                                <RadioButton
                                                                    name="status"
                                                                    label={t("deactivate")}
                                                                    checked={field.value === 'deactivate'}
                                                                    onChange={() => field.onChange('deactivate')}

                                                                />
                                                            </>
                                                        )}
                                                    />
                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>

                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => { setTranckingOpen(!tranckingOpen) }} textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={tranckingOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("trancking")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={tranckingOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box padding={'300'}>
                                                <BlockStack gap={'100'}>
                                                    <Controller
                                                        name="tracking"
                                                        control={control}
                                                        // rules={{
                                                        //     required: true,

                                                        // }}
                                                        render={({ field }) => (
                                                            <TextField
                                                                name="tracking"
                                                                label={t("tracking_code")}
                                                                value={field.value}
                                                                onChange={(value) => {
                                                                    value === '' ? field.onChange(trackingCode) : field.onChange(value.toUpperCase())
                                                                }}
                                                                type="text"
                                                                minLength={2}
                                                                maxLength={20}
                                                                showCharacterCount
                                                                placeholder={t("enter_tracking_code")}
                                                            />
                                                        )}
                                                    />
                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>


                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => { setSettingsOpen(!settingsOpen) }} textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={settingsOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("settings")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={settingsOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box padding={'300'}>
                                                <InlineStack gap={'100'} direction={'row'} align="start" blockAlign="center">
                                                    {settingsTab.map((item, index) => (
                                                        <Box 
                                                        key={index} 
                                                        background={settingsTabSelected === index ? "bg" : "bg-fill"} 
                                                        borderRadius="200"
                                                        >
                                                            <Button
                                                                size="medium"
                                                                variant="tertiary"
                                                                onClick={() => { handleSettingsTabChange(index) }}
                                                                fullWidth
                                                                >
                                                                {item.content}
                                                            </Button>
                                                        </Box>
                                                    ))

                                                    }
                                                </InlineStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>




                            </BlockStack>

                            <Button size="large" variant="primary" submit>
                                Save
                            </Button>
                        </Layout.Section>
                        <Layout.Section>
                            <Text>Preview here</Text>
                        </Layout.Section>
                    </Layout>
                </Page >
            </form >
    )
}

export default CreateComponent

export const action = async ({ request }) => {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    console.log(data);
    return null;
}