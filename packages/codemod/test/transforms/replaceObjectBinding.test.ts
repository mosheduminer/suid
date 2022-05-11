import findObjectBindingPatterns from "../../src/navigations/findObjectBindingPatterns";
import replaceObjectBinding from "../../src/transforms/replaceObjectBinding";
import format from "../format";
import transform from "../transform";

const t = (code: string) =>
  transform(code, [
    (source) => {
      findObjectBindingPatterns(source).forEach((node) =>
        replaceObjectBinding(node, {})
      );
    },
  ]);

describe("replaceObjectBinding", () => {
  it("adds var prefix", () => {
    expect(t("const { a } = props; console.log(a)")).toBe(
      `console.log(props.a)`
    );
  });
  it("uses original var name", () => {
    expect(t("const { a: b } = props; console.log(b)")).toBe(
      `console.log(props.a)`
    );
  });
  it("uses mergeProps", () => {
    expect(t("const { a = 1 } = props; console.log(a)")).toBe(
      format(`
      import { mergeProps } from "solid-js";
      const baseProps = mergeProps({
           a: 1,
      }, props);
      console.log(baseProps.a)
      `)
    );
  });
  it("uses mergeProps with getter", () => {
    expect(t("const { a = value() } = props; console.log(a)")).toBe(
      format(`
      import { mergeProps } from "solid-js";
      const baseProps = mergeProps({
          get a() { return value(); }
      }, props);
      console.log(baseProps.a)
      `)
    );
  });
  it("uses splitProps", () => {
    expect(t("const { a, ...other } = props; console.log(a, other)")).toBe(
      format(`
        import { splitProps } from "solid-js";
        const [, other] = splitProps(props, ["a"]);
        console.log(props.a, other)
      `)
    );
  });
  it("uses splitProps with accessor", () => {
    expect(
      t("const { a, sub: { b, ...other } } = props; console.log(b, other)")
    ).toBe(
      format(`
        import { splitProps } from "solid-js";
        const [, other] = splitProps(mergeProps(() => props.sub), ["b"]);
        console.log(props.sub.b, other)
      `)
    );
  });
  it("uses splitProps with accessor and optional access", () => {
    expect(
      t("const { a, sub: { b, ...other } = {} } = props; console.log(b, other)")
    ).toBe(
      format(`
        import { splitProps } from "solid-js";
        const [, other] = splitProps(mergeProps(() => props.sub || {}), ["b"]);
        console.log(props.sub?.b, other)
      `)
    );
  });
});
