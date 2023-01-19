export const enum NgtRendererClassId {
    type,
    parent,
    children,
    destroyed,
    compound,
    compoundParent,
    compounded,
    queueOps,
    attributes,
    properties,
    rawValue,
    ref,
    portalContainer,
    injectorFactory,
}

export const enum NgtCompoundClassId {
    applyFirst,
    props,
}

export const enum NgtQueueOpClassId {
    type,
    op,
    done,
}
