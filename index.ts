import { build, type Plugin } from "esbuild";
import fs from "node:fs/promises";
import { compileScript, compileStyle, parse } from "vue/compiler-sfc";

function simpleHash(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}

const createId = (name: string) => simpleHash(name);

function compileVue(source: string, filename: string) {
    const { descriptor, errors } = parse(source);

    const id = createId(filename);

    if (errors.length) {
        console.log(errors);
        throw new Error(errors.join());
    }

    const { content: scriptContent } = compileScript(
        descriptor,
        {
            id,
            inlineTemplate: true,
            // templateOptions: {
            //     scoped: true,
            //     id,
            //     ast: descriptor.template!.ast,
            //     compilerOptions: {
            //         scopeId: `data-v-${id}`,
            //     },
            // },
        },
    );

    const withScopeId = scriptContent.replace(
        "defineComponent({",
        `defineComponent({\n__scopeId: "data-v-${id}",`,
    );

    return {
        scriptContent: withScopeId,
    };
}

function compileVueStyles(source: string, filename: string) {
    const { descriptor, errors } = parse(source);

    const id = createId(filename);

    if (errors.length) {
        console.log(errors);
        throw new Error(errors.join());
    }

    const { code: styleContent } = compileStyle({
        source: descriptor.styles[0]?.content ?? "",
        id,
        filename,
        scoped: descriptor.styles[0]?.scoped,
    });

    return {
        styleContent,
    };
}

const plugin: Plugin = {
    name: "vue-compiler",
    setup(build) {
        build.onResolve({ filter: /\?css$/ }, async (args) => {
            return {
                path: args.path.split("?css")[0],
                namespace: "css",
            };
        });

        build.onLoad({ filter: /\.vue$/, namespace: "css" }, async (args) => {
            const text = await fs.readFile(args.path, "utf8");

            const { styleContent } = compileVueStyles(
                text,
                args.path,
            );

            return {
                contents: styleContent,
                loader: "css",
            };
        });

        build.onLoad({ filter: /\.vue$/ }, async (args) => {
            const text = await fs.readFile(args.path, "utf8");

            const { scriptContent } = compileVue(
                text,
                args.path,
            );

            return {
                contents: `import '${args.path}?css';\n${scriptContent}`,
                loader: "ts",
            };
        });
    },
};

await build({
    entryPoints: ["main.ts"],
    bundle: true,
    outdir: "out",
    plugins: [plugin],
    minify: false,
});
