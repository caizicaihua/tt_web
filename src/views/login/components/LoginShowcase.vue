<template>
  <section class="showcase" aria-labelledby="product-heading">
    <div class="eyebrow"><span></span> YOUR DATA. YOUR NEXT MOVE.</div>
    <h1 id="product-heading">看清每一份数据，<br />让投放<span class="accent">更有方向。</span></h1>
    <p class="intro">从账户到消耗，从今天到每个时刻。<br />在一个工作台，掌握你的广告表现。</p>

    <div class="data-scene" aria-label="广告数据工作台界面示意，不代表实际投放数据">
      <div class="scene-grid"></div>
      <div class="report-card">
        <div class="report-heading">
          <span class="report-icon"
            ><el-icon><DataAnalysis /></el-icon
          ></span>
          <div><strong>投放数据概览</strong><small>TikTok Ads · 账户表现</small></div>
        </div>
        <div class="report-tabs">
          <span class="selected">消耗趋势</span><span>账户表现</span
          ><span class="period"
            >今日 <el-icon><ArrowDown /></el-icon
          ></span>
        </div>
        <div class="chart">
          <div class="chart-lines"><span></span><span></span><span></span><span></span></div>
          <svg viewBox="0 0 420 130" fill="none" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop stop-color="#0c967a" stop-opacity="0.16" />
                <stop offset="1" stop-color="#0c967a" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 116 C20 116 28 98 50 101 S78 76 101 82 S129 56 152 62 S184 78 209 54 S240 71 264 46 S292 38 314 28 S349 45 372 18 S400 23 420 8 V130 H0Z"
              fill="url(#chart-fill)"
            />
            <path
              d="M0 116 C20 116 28 98 50 101 S78 76 101 82 S129 56 152 62 S184 78 209 54 S240 71 264 46 S292 38 314 28 S349 45 372 18 S400 23 420 8"
              stroke="#159c7f"
              stroke-width="2.6"
              stroke-linecap="round"
            />
          </svg>
          <div class="chart-labels">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span
            ><span>24:00</span>
          </div>
        </div>
        <div class="report-footer">
          <span><i></i> 产品界面示意 · 从数据中发现下一步</span><el-icon><Right /></el-icon>
        </div>
      </div>
      <div class="sync-card">
        <span class="sync-icon"
          ><el-icon><Refresh /></el-icon
        ></span>
        <div>
          <strong>10<span>分钟</span></strong
          ><small>数据同步周期</small>
        </div>
        <span class="sync-dot"></span>
      </div>
      <div class="account-chip">
        <span class="account-icon"
          ><el-icon><Wallet /></el-icon></span
        ><span>多账户，一目了然</span
        ><span class="chip-check"
          ><el-icon><Check /></el-icon
        ></span>
      </div>
    </div>
    <div class="benefits">
      <span
        ><el-icon><Connection /></el-icon>统一账户管理</span
      ><i></i
      ><span
        ><el-icon><Calendar /></el-icon>广告日账单</span
      ><i></i
      ><span
        ><el-icon><DataLine /></el-icon>实时数据追踪</span
      >
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowDown,
  Calendar,
  Check,
  Connection,
  DataAnalysis,
  DataLine,
  Refresh,
  Right,
  Wallet,
} from '@element-plus/icons-vue'
</script>

<style scoped>
.showcase {
  min-width: 0;
  padding-top: 5px;
}
.eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 10px;
  letter-spacing: 2.25px;
  color: #528373;
  font-weight: 600;
  margin-bottom: 23px;
}
.eyebrow span {
  width: 6px;
  height: 6px;
  background: #178b6b;
  border-radius: 50%;
}
h1 {
  margin: 0;
  font-size: clamp(34px, 3.6vw, 48px);
  line-height: 1.45;
  letter-spacing: -1.8px;
  font-weight: 650;
}
.accent {
  color: var(--brand);
}
.intro {
  margin: 19px 0 0;
  font-size: 15px;
  color: #7a8981;
  line-height: 1.95;
  letter-spacing: 0.15px;
}
.data-scene {
  position: relative;
  height: 312px;
  margin: 30px 0 17px;
  max-width: 535px;
}
.scene-grid {
  position: absolute;
  inset: -24px -16px -10px;
  background-image: radial-gradient(#a9c5b466 1px, transparent 1px);
  background-size: 16px 16px;
  mask-image: radial-gradient(ellipse, #000 30%, transparent 73%);
}
.report-card {
  position: absolute;
  inset: 14px 40px 15px 0;
  border: 1px solid #dce7e0;
  border-radius: 16px;
  background: #ffffffed;
  box-shadow: 0 14px 45px #284b3310;
  padding: 21px 24px 0;
  transform: rotate(-2deg);
}
.report-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}
.report-icon {
  height: 35px;
  width: 35px;
  display: grid;
  place-items: center;
  background: #edf6f1;
  color: #1a8a6d;
  border-radius: 10px;
  font-size: 20px;
}
.report-heading strong {
  display: block;
  font-size: 12px;
  font-weight: 600;
}
.report-heading small {
  display: block;
  margin-top: 5px;
  color: #99a59f;
  font-size: 9px;
}
.example-tag {
  margin-left: auto;
  font-size: 9px;
  color: #9aa69e;
  background: #f6f8f6;
  border: 1px solid #eaf0eb;
  padding: 3px 6px;
  border-radius: 4px;
}
.report-tabs {
  display: flex;
  align-items: center;
  gap: 21px;
  margin-top: 20px;
  font-size: 10px;
  color: #9ca9a1;
}
.selected {
  color: #258168;
  font-weight: 600;
}
.period {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #819188;
  font-size: 9px;
}
.chart {
  position: relative;
  margin-top: 19px;
  height: 120px;
}
.chart-lines {
  position: absolute;
  inset: 0 0 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.chart-lines span {
  border-bottom: 1px dashed #e6eee8;
}
.chart svg {
  position: relative;
  width: 100%;
  height: 96px;
  overflow: visible;
}
.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 8px;
  color: #9caaa1;
}
.report-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f0f3f0;
  padding-top: 12px;
  color: #90a095;
  font-size: 9px;
  margin-top: 10px;
}
.report-footer span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.report-footer i {
  width: 4px;
  height: 4px;
  background: #65a990;
  border-radius: 50%;
}
.sync-card {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 17px 18px;
  background: white;
  border: 1px solid #e2ebe5;
  border-radius: 13px;
  box-shadow: 0 8px 24px #244c3512;
  transform: rotate(4deg);
}
.sync-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #edf8f1;
  color: #2c9572;
  font-size: 20px;
}
.sync-card strong {
  font-size: 23px;
  font-weight: 600;
  letter-spacing: -0.6px;
}
.sync-card strong span {
  font-size: 10px;
  font-weight: 400;
  margin-left: 5px;
}
.sync-card small {
  display: block;
  color: #93a096;
  font-size: 9px;
  margin-top: 3px;
}
.sync-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #54a881;
  align-self: start;
}
.account-chip {
  position: absolute;
  bottom: 1px;
  right: 15px;
  background: #fff;
  border: 1px solid #e2ebe5;
  border-radius: 11px;
  box-shadow: 0 8px 24px #244c3510;
  padding: 11px 15px 11px 10px;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 10px;
  color: #52695d;
  transform: rotate(2deg);
}
.account-icon {
  width: 29px;
  height: 29px;
  background: #f0f4ed;
  color: #83976d;
  display: grid;
  place-items: center;
  border-radius: 8px;
  font-size: 15px;
}
.chip-check {
  display: grid;
  place-items: center;
  color: #218e70;
  background: #edf7f1;
  border-radius: 50%;
  padding: 3px;
  margin-left: 9px;
}
.benefits {
  display: flex;
  align-items: center;
  gap: 17px;
  font-size: 11px;
  color: #7f9185;
}
.benefits span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.benefits .el-icon {
  font-size: 14px;
  color: #779b86;
}
.benefits > i {
  height: 10px;
  width: 1px;
  background: #d9e3db;
}
@media (max-width: 1050px) {
  .benefits {
    gap: 9px;
    font-size: 10px;
  }
  .report-card {
    right: 20px;
    padding: 19px 18px 0;
  }
  .sync-card {
    right: -5px;
    padding: 13px;
  }
}
@media (max-width: 800px) {
  .showcase {
    display: none;
  }
}
</style>
