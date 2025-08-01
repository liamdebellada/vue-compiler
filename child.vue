<script setup lang="ts">
    import { ref, useAttrs } from 'vue'

    const count = ref<number>(0)

    console.log('hi')
</script>

<template>
  <button @click="count++">count me</button>
  <div v-bind="$attrs" class="bob">{{count}}</div>
</template>

<style scoped>
  .bob {
    background-color: red;
  }
</style>