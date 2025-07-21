// Aggressive React 19 type overrides
declare module "react" {
  // Override the JSX namespace completely
  namespace JSX {
    type Element = any;
    type ElementType = any;
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface IntrinsicAttributes {
      [key: string]: any;
    }
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
  }

  // Override component types to be more permissive
  type ComponentType<P = {}> = any;
  type FunctionComponent<P = {}> = any;
  type FC<P = {}> = any;

  // Override ReactNode to be more permissive
  type ReactNode = any;
  type ReactElement<P = any, T = any> = any;
  type ReactPortal = any;
  type ReactFragment = any;
}

// Global JSX override
declare global {
  namespace JSX {
    type Element = any;
    type ElementType = any;
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface IntrinsicAttributes {
      [key: string]: any;
    }
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

export {};
