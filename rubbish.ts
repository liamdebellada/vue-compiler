import { compileTemplate, parse } from "@vue/compiler-sfc";

console.log("=== TESTING CORRECT SCOPED COMPILATION ===");

const sourceWithScoped = `
<template>
  <div class="test">Hello</div>
</template>
<style scoped>
.test { color: red; }
</style>
`;

const { descriptor } = parse(sourceWithScoped, { filename: "test.vue" });

// Method 1: The key issue might be that we need to pass the compilerOptions differently
console.log("\n=== METHOD 1: Correct compilerOptions structure ===");
try {
    const scopeId = "data-v-12345678";

    const result1 = compileTemplate({
        source: descriptor.template.content,
        filename: "test.vue",
        id: scopeId,
        scoped: descriptor.styles.some((s) => s.scoped), // Check if there are actually scoped styles
        compilerOptions: {
            mode: "function",
            prefixIdentifiers: false,
            scopeId: scopeId,
        },
    });

    console.log("Method 1 - Success:", !!result1.code);
    console.log("Method 1 - Has data-v:", result1.code.includes("data-v-"));
    console.log("Method 1 - Code sample:", result1.code.substring(0, 300));
} catch (e) {
    console.log("Method 1 failed:", e.message);
}

// Method 2: Try with different mode
console.log("\n=== METHOD 2: Module mode ===");
try {
    const scopeId = "data-v-12345678";

    const result2 = compileTemplate({
        source: descriptor.template.content,
        filename: "test.vue",
        id: scopeId,
        scoped: true,
        // compilerOptions: {
        //     mode: "module",
        //     scopeId: scopeId,
        // },
    });

    console.log("Method 2 - Success:", !!result2.code);
    console.log("Method 2 - Has data-v:", result2.code.includes("data-v-"));
    console.log("Method 2 - Code sample:", result2.code.substring(0, 300));
} catch (e) {
    console.log("Method 2 failed:", e.message);
}

// Method 3: Try without compilerOptions but with transformAssetUrls
console.log("\n=== METHOD 3: With transformAssetUrls ===");
try {
    const scopeId = "data-v-12345678";

    const result3 = compileTemplate({
        source: descriptor.template.content,
        filename: "test.vue",
        id: scopeId,
        scoped: true,
        transformAssetUrls: true,
        compilerOptions: {
            scopeId: scopeId,
        },
    });

    console.log("Method 3 - Success:", !!result3.code);
    console.log("Method 3 - Has data-v:", result3.code.includes("data-v-"));
    console.log("Method 3 - Code sample:", result3.code.substring(0, 300));
} catch (e) {
    console.log("Method 3 failed:", e.message);
}

// Method 4: Check if it's a version issue - try minimal options
console.log("\n=== METHOD 4: Minimal approach ===");
try {
    const result4 = compileTemplate({
        source: descriptor.template.content,
        filename: "test.vue",
        id: "data-v-12345678",
        scoped: true,
    });

    console.log("Method 4 - Success:", !!result4.code);
    console.log("Method 4 - Has data-v:", result4.code.includes("data-v-"));

    // Check if the issue is in the render function parameters
    const renderMatch = result4.code.match(/function render\([^)]*\)/);
    console.log("Method 4 - Render function signature:", renderMatch?.[0]);

    // Look for any _withScopeId calls or similar
    const scopeIdMatches = result4.code.match(/_withScopeId|scopeId|data-v-/g);
    console.log("Method 4 - Scope-related matches:", scopeIdMatches);

    console.log("Method 4 - Full code:");
    console.log(result4.code);
} catch (e) {
    console.log("Method 4 failed:", e.message);
}

// Method 5: Test what happens if we use different versions of the API
console.log("\n=== METHOD 5: Alternative API approach ===");
try {
    // Some versions might expect different parameter names
    const result5 = compileTemplate({
        source: descriptor.template.content,
        filename: "test.vue",
        id: "data-v-test123",
        scoped: true,
        compilerOptions: {
            scopeId: "data-v-test123",
            // Try different combinations of options
            mode: "function",
            prefixIdentifiers: false,
            hoistStatic: false,
            cacheHandlers: false,
        },
    });

    console.log("Method 5 - Success:", !!result5.code);
    console.log("Method 5 - Has data-v:", result5.code.includes("data-v-"));
} catch (e) {
    console.log("Method 5 failed:", e.message);
}

// Method 6: Check what your Vue version expects
console.log("\n=== DEBUG: Check descriptor and styles ===");
console.log("Descriptor has styles:", descriptor.styles.length);
console.log("Styles are scoped:", descriptor.styles.map((s) => s.scoped));
console.log("Template content:", JSON.stringify(descriptor.template.content));

// The nuclear option - check if this is a known issue with your version
console.log("\n=== FINAL TEST: Check if scoped compilation is broken ===");
const verySimple = `<div>test</div>`;
try {
    const nuclear = compileTemplate({
        source: verySimple,
        filename: "test.vue",
        id: "data-v-nuclear",
        scoped: true,
        compilerOptions: {
            scopeId: "data-v-nuclear",
        },
    });

    console.log("Nuclear test - Has data-v:", nuclear.code.includes("data-v-"));
    console.log("Nuclear test - Full code:");
    console.log(nuclear.code);
} catch (e) {
    console.log("Nuclear test failed:", e.message);
}
