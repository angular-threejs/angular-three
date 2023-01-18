export const enum NgtRendererClassId {
    type,
    parent,
    children,
    removed,
    compound,
    compoundParent,
    compounded,
    queueOps,
    attributes,
    properties,
    rawValue,
    ref,
    portalContainer,
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
