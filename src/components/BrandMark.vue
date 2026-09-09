<template>
  <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
</template>

<style scoped>
.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: var(--brand);
  box-shadow: 0 4px 12px #087f6818;
  flex-shrink: 0;
}
i {
  display: block;
  width: 5px;
  height: 13px;
  background: white;
  border-radius: 4px;
  transform: skewY(-12deg);
}
i:nth-child(2) {
  height: 23px;
}
i:nth-child(3) {
  height: 17px;
}
</style>
