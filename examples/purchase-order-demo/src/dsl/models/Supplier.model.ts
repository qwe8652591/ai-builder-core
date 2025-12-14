/**
 * 供应商模型
 */

import {
  Entity,
  Column,
  PrimaryKey,
  FieldTypes,
} from '@qwe8652591/dsl-core';

/**
 * 供应商实体
 */
@Entity({ table: 'suppliers', comment: '供应商' })
export class Supplier {
  @PrimaryKey()
  @Column({ type: FieldTypes.STRING, label: '供应商编码' })
  code!: string;

  @Column({ type: FieldTypes.STRING, label: '供应商名称', required: true })
  name!: string;

  @Column({ type: FieldTypes.STRING, label: '联系人' })
  contactPerson?: string;

  @Column({ type: FieldTypes.STRING, label: '联系电话' })
  contactPhone?: string;

  @Column({ type: FieldTypes.STRING, label: '地址' })
  address?: string;

  @Column({ type: FieldTypes.STRING, label: '状态' })
  status?: 'ACTIVE' | 'INACTIVE';

  @Column({ type: FieldTypes.DATETIME, label: '创建时间' })
  createdAt?: Date;

  @Column({ type: FieldTypes.DATETIME, label: '更新时间' })
  updatedAt?: Date;
}

