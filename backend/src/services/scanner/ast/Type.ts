export type TypeKind =
  | 'String'
  | 'Number'
  | 'Boolean'
  | 'BigInt'
  | 'Null'
  | 'Undefined'
  | 'Object'
  | 'Array'
  | 'Tuple'
  | 'Buffer'
  | 'Uint8Array'
  | 'Function'
  | 'Promise'
  | 'Unknown'
  | 'Any'
  | 'Never'
  | 'Union'
  | 'Intersection'
  | 'Literal';

export interface Type {
  readonly kind: TypeKind;
  readonly value?: any; // For Literal types
  readonly elementTypes?: Type[]; // For Union/Intersection/Tuple/Array
  readonly returnType?: Type; // For Function/Promise return signatures
}

export const Types = {
  String: { kind: 'String' } as Type,
  Number: { kind: 'Number' } as Type,
  Boolean: { kind: 'Boolean' } as Type,
  BigInt: { kind: 'BigInt' } as Type,
  Null: { kind: 'Null' } as Type,
  Undefined: { kind: 'Undefined' } as Type,
  Object: { kind: 'Object' } as Type,
  Buffer: { kind: 'Buffer' } as Type,
  Uint8Array: { kind: 'Uint8Array' } as Type,
  Unknown: { kind: 'Unknown' } as Type,
  Any: { kind: 'Any' } as Type,
  Never: { kind: 'Never' } as Type,
  
  createLiteral(value: any, kind: 'String' | 'Number' | 'Boolean'): Type {
    return { kind: 'Literal', value, elementTypes: [{ kind } as any] };
  },
  
  createArray(elementType: Type): Type {
    return { kind: 'Array', elementTypes: [elementType] };
  },

  createTuple(elementTypes: Type[]): Type {
    return { kind: 'Tuple', elementTypes };
  },

  createUnion(elementTypes: Type[]): Type {
    return { kind: 'Union', elementTypes };
  },

  createIntersection(elementTypes: Type[]): Type {
    return { kind: 'Intersection', elementTypes };
  },

  createFunction(returnType: Type): Type {
    return { kind: 'Function', returnType };
  },

  createPromise(resolvedType: Type): Type {
    return { kind: 'Promise', returnType: resolvedType };
  }
};

export function isPrimitive(type: Type): boolean {
  const kind = type.kind;
  if (kind === 'String' || kind === 'Number' || kind === 'Boolean' || kind === 'BigInt' || kind === 'Null' || kind === 'Undefined') {
    return true;
  }
  if (kind === 'Literal' && type.elementTypes && type.elementTypes[0]) {
    return isPrimitive(type.elementTypes[0]);
  }
  return false;
}

export function isBufferLike(type: Type): boolean {
  return type.kind === 'Buffer' || type.kind === 'Uint8Array';
}

export function isAssignable(source: Type, target: Type): boolean {
  if (target.kind === 'Any' || target.kind === 'Unknown') return true;
  if (source.kind === 'Never') return true;
  if (source.kind === target.kind && source.value === target.value) return true;

  if (target.kind === 'Union' && target.elementTypes) {
    return target.elementTypes.some(t => isAssignable(source, t));
  }

  if (source.kind === 'Union' && source.elementTypes) {
    return source.elementTypes.every(s => isAssignable(s, target));
  }

  if (source.kind === 'Literal' && source.elementTypes && source.elementTypes[0]) {
    return isAssignable(source.elementTypes[0], target);
  }

  return false;
}
