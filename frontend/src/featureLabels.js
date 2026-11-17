const FIELD_LABELS = {
  _AGE80: 'Tuổi',
  _SEX: 'Giới tính',
  DIABETE4: 'Tình trạng tiểu đường',
  _BMI5: 'BMI (chỉ số khối cơ thể)',
  _SMOKER3: 'Tình trạng hút thuốc',
  EXERANY2: 'Hoạt động thể lực',
  CHCKDNY2: 'Tiền sử bệnh thận',
  MAXDRNKS: 'Số đồ uống có cồn nhiều nhất trong một lần uống',
  CVDSTRK3: 'Tiền sử đột quỵ (tai biến mạch máu não)',
}

const OPTION_LABELS = {
  _SEX: {
    1: 'Nam',
    2: 'Nữ',
  },
  DIABETE4: {
    1: 'Có tiểu đường',
    2: 'Có tiểu đường, chỉ trong khi mang thai',
    3: 'Không',
    4: 'Được bác sĩ báo đường huyết cao, chưa đến mức tiểu đường',
  },
  _SMOKER3: {
    1: 'Hút thuốc mỗi ngày',
    2: 'Hút thuốc một số ngày',
    3: 'Đã từng hút thường xuyên, hiện đã bỏ',
    4: 'Chưa từng hút thường xuyên',
  },
  EXERANY2: {
    0: 'Không',
    1: 'Có',
  },
  CHCKDNY2: {
    1: 'Có',
    2: 'Không',
  },
  CVDSTRK3: {
    0: 'Không',
    1: 'Có',
    2: 'Không',
  },
}

export function getFeatureLabel(name, fallback = name) {
  return FIELD_LABELS[name] ?? fallback
}

export function getFeatureOptionLabel(name, value, fallback) {
  const key = String(Number(value))
  const label = OPTION_LABELS[name]?.[key]
  if (label) return label
  if (typeof fallback === 'string' && /^Mã BRFSS\b/i.test(fallback)) {
    return 'Lựa chọn chưa được mô tả'
  }
  return fallback ?? String(value)
}

export function formatFeatureValue(name, value) {
  return getFeatureOptionLabel(name, value, String(value))
}
