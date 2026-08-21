# ImageToPinDou 优化文档

> 模块：`src/utils/ImageToPinDou.js`
> 交互层：`src/components/Page04.jsx`
> 说明：本文记录拼豆转换功能的优化条目，每条包含现状、目标、方案与验收标准。

---

## 优化 13：成本预估

### 现状

- 材料清单（`Page04.jsx` 右侧 aside）只展示每色 `count`（用豆颗数），没有单价与成本信息。
- 用户拿到材料表后仍需自行对照采购价计算总价，无法直接用于下单或预算。

### 目标

1. 给色卡色号配置单价，材料表自动计算每色成本与总成本。
2. 支持用户手动改价，并按「袋/盒」取整估算实际购买量。
3. 支持导出带价格列的材料 CSV。

### 方案

#### 1. 色卡数据增加价格字段

`swatch` 结构扩展可选字段（保持向后兼容），直接加在 `ImageToPinDou.js` 的 `DEFAULT_BEAD_PALETTE` 中：

```js
{ code: "PD01", name: "白色", hex: "#F8F7F2", rgb: [...], unitPrice: 0.05, bagSize: 1000 }
```

- `unitPrice`：每颗豆单价（元）。
- `bagSize`：每袋颗数（可选，用于按袋取整）。

算法 `convertImageToBeads` 的 `colors` 返回值已携带 swatch 全量字段（`{ ...swatch, count }`），因此价格字段会自然透传到 UI，无需改算法。

#### 2. 材料清单 UI 增加价格列与汇总

在 `Page04.jsx` 材料清单每行增加可编辑的单价输入框（默认取 `unitPrice`），并显示小计：

```
[●] PD01 · 白色   rgb(...)   1240 颗  [单价 0.05]  = 62.00 元
```

底部汇总显示：

- 总颜色数、总用豆颗数（现有 `totalBeads`）。
- 总成本 = Σ(count × unitPrice)。
- 若配置了 `bagSize`，额外显示「需购买袋数 = Σ ceil(count / bagSize)」及各色袋数。

#### 3. 用户手动改价

- 单价输入框支持 `type="number"`、`min="0"`、`step="0.01"`。
- 修改后实时重算小计与总成本。
- 将用户覆盖的单价写入 `localStorage`（key 例如 `pindou-prices`），刷新后保留；未覆盖的色号继续使用色卡默认值。

#### 4. 导出带价格的材料 CSV

新增导出按钮，生成 CSV：

```csv
code,name,count,unit_price,subtotal
PD01,白色,1240,0.05,62.00
PD02,奶油,340,0.05,17.00
```

（如配置 `bagSize`，追加 `bags_needed` 列。）导出实现可用 `Blob` + `URL.createObjectURL` 触发下载，命名如 `pindou-materials.csv`。

### 涉及文件

- `src/utils/ImageToPinDou.js`（`DEFAULT_BEAD_PALETTE` 增加价格字段）
- `src/components/Page04.jsx`（价格列 + 汇总 + CSV 导出 + localStorage）
- 可选：新增 `src/utils/exportMaterials.js` 复用导出逻辑

### 验收标准

- 填写单价后，每色小计与总成本计算正确，实时更新。
- 刷新页面后手动改价仍保留；未改价色号使用色卡默认价。
- 配置 `bagSize` 时正确显示各色所需袋数并按袋估算总量。
- 导出的 CSV 可被 Excel / Numbers 正确打开，价格列与页面一致。

---

## 备注

- 本文档与代码实现可能存在差异，落地前请对照最新代码确认。
- 优化条目编号沿用评审清单，便于追溯；新增条目可追加并保持编号连续。
