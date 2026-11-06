import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../api.js'

const MODELS = [
  { key: 'random_forest', label: 'Random Forest', color: '#e34b55' },
  { key: 'xgboost', label: 'XGBoost', color: '#a46c0c' },
  { key: 'ann', label: 'ANN', color: '#078968' },
]
const CHART = { width: 760, height: 270, left: 48, right: 18, top: 24, bottom: 42 }
const PAGE_SIZE = 8

function averageScore(prediction) {
  const values = Object.values(prediction.results ?? {}).map((result) => result.probability)
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

function HistoryChart({ entries }) {
  const plotWidth = CHART.width - CHART.left - CHART.right
  const plotHeight = CHART.height - CHART.top - CHART.bottom
  const xAt = (index) => CHART.left + (entries.length < 2 ? plotWidth / 2 : (index / (entries.length - 1)) * plotWidth)
  const yAt = (probability) => CHART.top + (1 - probability) * plotHeight

  return <div className="history-chart-wrap"><svg className="history-chart" viewBox={`0 0 ${CHART.width} ${CHART.height}`} role="img" aria-label="Biểu đồ xác suất dự đoán qua các lần đánh giá">
    {[0, 25, 50, 75, 100].map((tick) => { const y = yAt(tick / 100); return <g key={tick}><line x1={CHART.left} x2={CHART.width - CHART.right} y1={y} y2={y} className="chart-gridline" /><text x={CHART.left - 10} y={y + 4} textAnchor="end" className="chart-label">{tick}%</text></g> })}
    {MODELS.map((model) => {
      const points = entries.map((entry, index) => ({ index, value: entry.results?.[model.key]?.probability })).filter((point) => Number.isFinite(point.value))
      if (!points.length) return null
      const path = points.map((point, index) => `${index ? 'L' : 'M'} ${xAt(point.index)} ${yAt(point.value)}`).join(' ')
      return <g key={model.key}><path d={path} fill="none" stroke={model.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />{points.map((point) => <circle key={`${model.key}-${point.index}`} cx={xAt(point.index)} cy={yAt(point.value)} r="4" fill="white" stroke={model.color} strokeWidth="2.5"><title>{model.label}: {(point.value * 100).toFixed(1)}%</title></circle>)}</g>
    })}
    {entries.length > 0 && [0, Math.floor((entries.length - 1) / 2), entries.length - 1].filter((value, index, values) => values.indexOf(value) === index).map((index) => <text key={index} x={xAt(index)} y={CHART.height - 10} textAnchor={index === 0 ? 'start' : index === entries.length - 1 ? 'end' : 'middle'} className="chart-label">{new Date(entries[index].createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</text>)}
  </svg></div>
}

function downloadCsv(entries) {
  const columns = ['createdAt', 'model', 'random_forest', 'xgboost', 'ann']
  const rows = entries.map((entry) => [entry.createdAt, entry.model, ...MODELS.map(({ key }) => entry.results?.[key]?.probability ?? '')])
  const csv = [columns, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }))
  link.download = 'lich-su-du-doan.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

function History() {
  const [predictions, setPredictions] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')
  const [periodStart, setPeriodStart] = useState(0)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    api.get('/predictions?limit=50')
      .then(({ data }) => setPredictions(data.predictions))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...predictions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const cutoff = periodStart
  const filtered = sorted.filter((item) => {
    const matchesPeriod = new Date(item.createdAt).getTime() >= cutoff
    const searchable = `${new Date(item.createdAt).toLocaleDateString('vi-VN')} ${item.model} ${Object.keys(item.results ?? {}).join(' ')}`.toLowerCase()
    return matchesPeriod && searchable.includes(query.trim().toLowerCase())
  })
  const newestFirst = [...filtered].reverse()
  const pages = Math.max(1, Math.ceil(newestFirst.length / PAGE_SIZE))
  const visible = newestFirst.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const average = filtered.map(averageScore).filter(Number.isFinite)
  const mean = average.length ? average.reduce((sum, value) => sum + value, 0) / average.length : null
  const firstScore = averageScore(filtered[0] ?? {})
  const lastScore = averageScore(filtered.at(-1) ?? {})
  const change = firstScore !== null && lastScore !== null && filtered.length > 1 ? (lastScore - firstScore) * 100 : null

  return (
    <div className="content-page history-page">
      <div className="history-heading"><div><p className="eyebrow">DỮ LIỆU Y TẾ CÁ NHÂN</p><h1>Lịch sử đánh giá nguy cơ</h1><p className="page-description">Theo dõi các lần đánh giá đã lưu và xem lại kết quả của từng mô hình.</p></div><Link className="button button-white" to="/predict"><span aria-hidden="true">＋</span> Dự đoán </Link></div>
      {error && <div className="notice notice-error">{error}</div>}
      {loading && <div className="page-loading">Đang tải lịch sử...</div>}
      {!loading && !error && <>
        <section className="history-stats"><article className="stat-card"><p>TỔNG SỐ LẦN ĐÁNH GIÁ</p><strong>{filtered.length}<small> lần</small></strong><span>Trong khoảng thời gian đã chọn</span></article><article className="stat-card"><p>ĐÁNH GIÁ GẦN NHẤT</p><strong className="stat-date">{filtered.length ? new Date(filtered.at(-1).createdAt).toLocaleDateString('vi-VN') : '—'}</strong><span>{filtered.length ? 'Đã lưu trong lịch sử' : 'Chưa có dữ liệu'}</span></article><article className="stat-card"><p>XÁC SUẤT TRUNG BÌNH</p><strong className="stat-average">{mean === null ? '—' : `${(mean * 100).toFixed(1)}%`}</strong><span>{change === null ? 'Từ các kết quả đang hiển thị' : `${change > 0 ? '+' : ''}${change.toFixed(1)} điểm % so với lần đầu`}</span></article></section>
        <section className="chart-panel"><div className="chart-heading"><div><p className="eyebrow">BIỂU ĐỒ LỊCH SỬ</p><h2>Xác suất theo từng mô hình</h2><p>Chỉ hiển thị dự đoán đã lưu trong tài khoản.</p></div><span className="chart-count">{filtered.length} lần</span></div>{filtered.length ? <><HistoryChart entries={filtered} /><div className="chart-legend">{MODELS.map((model) => <span key={model.key}><i style={{ backgroundColor: model.color }} />{model.label}</span>)}</div></> : <div className="chart-empty">Chưa có dữ liệu trong khoảng thời gian này.</div>}</section>
        <section className="history-table-panel"><div className="history-toolbar"><div className="period-tabs" aria-label="Lọc khoảng thời gian">{[['all', 'Tất cả'], ['30', '30 ngày'], ['90', '3 tháng'], ['365', '1 năm']].map(([value, label]) => <button className={period === value ? 'selected' : ''} key={value} onClick={() => { setPeriod(value); setPeriodStart(value === 'all' ? 0 : Date.now() - Number(value) * 24 * 60 * 60 * 1000); setPage(0) }}>{label}</button>)}</div><label className="history-search"><span aria-hidden="true">⌕</span><input aria-label="Tìm trong lịch sử" placeholder="Tìm ngày hoặc mô hình..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} /></label><button className="button button-white export-button" onClick={() => downloadCsv(filtered)} disabled={!filtered.length}><span aria-hidden="true">⇩</span> Xuất CSV</button></div>
          {filtered.length ? <div className="history-table-scroll"><table className="history-table"><thead><tr><th>Ngày đánh giá</th><th>Mô hình</th><th>Xác suất</th><th>Kết quả</th><th></th></tr></thead><tbody>{visible.map((item) => { const scores = Object.values(item.results ?? {}); const top = scores.reduce((best, value) => !best || value.probability > best.probability ? value : best, null); return <tr key={item._id}><td><strong>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</strong><small>{new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small></td><td>{item.model === 'all' ? 'So sánh 3 mô hình' : MODELS.find((model) => model.key === item.model)?.label ?? item.model}</td><td>{top ? `${(top.probability * 100).toFixed(1)}%` : '—'}</td><td><span className={`outcome-badge ${top?.prediction ? 'outcome-positive' : 'outcome-negative'}`}>{top?.label ?? 'Chưa có kết quả'}</span></td><td><Link className="table-detail-link" to={`/history/${item._id}`}>Chi tiết <span aria-hidden="true">→</span></Link></td></tr> })}</tbody></table></div> : <div className="chart-empty">Không tìm thấy lần đánh giá phù hợp.</div>}
          {filtered.length > PAGE_SIZE && <div className="table-pagination"><span>Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} trên {filtered.length} lần</span><div><button className="button button-white button-small" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Trước</button><span>{page + 1} / {pages}</span><button className="button button-white button-small" disabled={page + 1 >= pages} onClick={() => setPage((current) => current + 1)}>Sau</button></div></div>}
        </section>
        <p className="history-disclaimer">Kết quả chỉ mang tính tham khảo, không thay thế chẩn đoán y khoa.</p>
      </>}
    </div>
  )
}

export default History
