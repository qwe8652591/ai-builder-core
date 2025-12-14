/**
 * 物料模型
 */

import {
  Entity,
  Column,
  PrimaryKey,
  FieldTypes,
} from '@ai-builder/jsx-runtime';

/**
 * 物料实体
 */
@Entity({ table: 'materials', comment: '物料' })
export class Material {
  @PrimaryKey()
  @Column({ type: FieldTypes.STRING, label: '物料编码' })
  code!: string;

  @Column({ type: FieldTypes.STRING, label: '物料名称', required: true })
  name!: string;

  @Column({ type: FieldTypes.STRING, label: '规格型号' })
  specification?: string;

  @Column({ type: FieldTypes.STRING, label: '单位' })
  unit?: string;

  @Column({ type: FieldTypes.NUMBER, label: '标准单价' })
  price?: number;

  @Column({ type: FieldTypes.NUMBER, label: '最新单价' })
  latestPrice?: number;

  @Column({ type: FieldTypes.STRING, label: '物料类别' })
  category?: string;

  @Column({ type: FieldTypes.STRING, label: '状态' })
  status?: 'ACTIVE' | 'INACTIVE';

  @Column({ type: FieldTypes.DATETIME, label: '创建时间' })
  createdAt?: Date;

  @Column({ type: FieldTypes.DATETIME, label: '更新时间' })
  updatedAt?: Date;
}

