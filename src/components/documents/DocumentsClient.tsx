'use client'
import { useState } from 'react'
import { differenceInDays, format } from 'date-fns'
import { Plus, Search, Eye, Pencil, Trash2, X, Download, FileText, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Sidebar from '@/components/dashboard/Sidebar'
import FileUploader from './FileUploader'
import DocumentViewer from './DocumentViewer'

const CAT_ICONS: Record<string, string> = {
  PERSONAL_ID:'🪪',PASSPORT:'🛂',BUSINESS_LICENSE:'🏢',INSURANCE:'🛡️',
  CONTRACT:'📝',MEDICAL:'🏥',CERTIFICATION:'🎓',PERMIT:'📋',
  VEHICLE:'🚗',PROPERTY:'🏠',TAX:'💰',OTHER:'📄',
}
const CATEGORIES = ['PERSONAL_ID','PASSPORT','BUSINESS_LICENSE','INSURANCE','CONTRACT','MEDICAL','CERTIFICATION','PERMIT','VEHICLE','PROPERTY','TAX','OTHER']

function getStatus(expiryDate: string) {
  const days = differenceInDays(new Date(expiryDate), new Date())
  if (days < 0) return { label:'Expired', cls:'badge-expired', color:'#dc2626', days }
  if (days <= 30) return { label:'Urgent', cls:'badge-urgent', color:'#d97706', days }
  if (days <= 90) return { label:'Expiring soon', cls:'badge-soon', color:'#ca8a04', days }
  return { label:'Valid', cls:'badge-valid', color:'#16a34a', days }
}

function formatSize(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const EMPTY_FORM = { name:'', category:'PERSONAL_ID', expiryDate:'', issueDate:'', issuedBy:'', documentNo:'', notes:'', fileUrl:'', fileName:'', fileSize:0, mimeType:'' }

export default function DocumentsClient({ docs: initialDocs, session }: any) {
  const [docs, setDocs] = useState(initialDocs)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [viewerDoc, setViewerDoc] = useState<any>(null)
  const [viewDetailDoc, setViewDetailDoc] = useState<any>(null)
  const [editDoc, setEditDoc] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  function toggleSelect(id: string) { setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s }) }
  function clearSel() { setSelected(new Set()) }
  async function bulkDelete() {
    if (!selected.size || !confirm(`Delete ${selected.size} document(s)? Cannot be undone.`)) return
    setBulkDeleting(true)
    try {
      const res = await fetch('/api/documents/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'delete', ids:[...selected] }) })
      if (!res.ok) throw new Error('Bulk delete failed')
      setDocs((p:any[]) => p.filter(d => !selected.has(d.id))); toast.success(`${selected.size} deleted`); clearSel()
    } catch (err:any) { toast.error(err.message) }
    finally { setBulkDeleting(false) }
  }

  const filtered = docs.filter((d: any) => {
    const { days } = getStatus(d.expiryDate)
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.documentNo?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filter==='all'?true:filter==='expired'?days<0:filter==='urgent'?(days>=0&&days<=30):filter==='soon'?(days>30&&days<=90):days>90
    const matchCat = catFilter==='all'||d.category===catFilter
    return matchSearch && matchStatus && matchCat
  })

  function openAdd() { setForm(EMPTY_FORM); setEditDoc(null); setShowModal(true) }
  function openEdit(doc: any) {
    setForm({
      name:doc.name, category:doc.category,
      expiryDate:doc.expiryDate.split('T')[0],
      issueDate:doc.issueDate?.split('T')[0]||'',
      issuedBy:doc.issuedBy||'', documentNo:doc.documentNo||'',
      notes:doc.notes||'', fileUrl:doc.fileUrl||'',
      fileName:doc.fileName||'', fileSize:doc.fileSize||0, mimeType:doc.mimeType||''
    })
    setEditDoc(doc); setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const url = editDoc ? `/api/documents/${editDoc.id}` : '/api/documents'
      const res = await fetch(url, { method:editDoc?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const saved = await res.json()
      if (editDoc) setDocs((p:any[]) => p.map(d => d.id===saved.id?saved:d))
      else setDocs((p:any[]) => [...p, saved].sort((a,b) => new Date(a.expiryDate).getTime()-new Date(b.expiryDate).getTime()))
      toast.success(editDoc?'Updated!':'Document added!')
      setShowModal(false)
    } catch (err:any) {
      if (err.message?.includes('plan') || err.message?.includes('limit')) {
        toast.error(err.message + ' — Upgrade your plan.', { action: { label: 'Upgrade →', onClick: () => window.location.href = '/billing' } })
      } else {
        toast.error(err.message || 'Failed to save document')
      }
    }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/documents/${id}`, { method:'DELETE' })
      setDocs((p:any[]) => p.filter(d => d.id!==id))
      toast.success('Deleted')
      setDeleteId(null)
    } catch { toast.error('Failed to delete') }
  }

  function exportCSV() {
    const rows=[['Name','Category','Expiry Date','Days Left','Status','Doc No','Issued By','File','Notes']]
    docs.forEach((d:any) => {
      const {days,label}=getStatus(d.expiryDate)
      rows.push([d.name,d.category.replace(/_/g,' '),format(new Date(d.expiryDate),'dd/MM/yyyy'),String(days),label,d.documentNo||'',d.issuedBy||'',d.fileName||'',d.notes||''])
    })
    const csv=rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')
    const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='docalert-documents.csv';a.click()
  }

  // Counts for filter badges
  const counts = { all:docs.length, expired:0, urgent:0, soon:0, valid:0 }
  docs.forEach((d:any)=>{
    const {days}=getStatus(d.expiryDate)
    if(days<0) counts.expired++
    else if(days<=30) counts.urgent++
    else if(days<=90) counts.soon++
    else counts.valid++
  })

  return (
    <div className="flex h-screen bg-[#f8f7f4] overflow-hidden">
      <Sidebar session={session} active="documents" />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between pl-14 md:pl-6 flex-shrink-0">
          <div>
            <h1 className="text-base md:text-lg font-semibold text-gray-900">Documents</h1>
            <p className="text-xs text-gray-400 hidden sm:block">{docs.length} total · {counts.expired} expired · {counts.urgent} urgent</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="hidden sm:flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
              <Download size={13}/> Export
            </button>
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-gray-800 transition-colors">
              <Plus size={13}/> <span className="hidden sm:inline">Add document</span><span className="sm:hidden">Add</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Filters */}
          <div className="p-4 md:p-6 pb-0 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input type="text" placeholder="Search documents..." value={search} onChange={e=>setSearch(e.target.value)} className="input pl-9 w-full text-sm"/>
              </div>
              <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="input w-full sm:w-48 text-sm">
                <option value="all">All categories</option>
                {CATEGORIES.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            {/* Status filters */}
            <div className="flex gap-1.5 flex-wrap">
              {([['all','All'],['expired','Expired'],['urgent','Urgent'],['soon','Soon'],['valid','Valid']] as [string,string][]).map(([f,label])=>(
                <button key={f} onClick={()=>setFilter(f)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${filter===f?'bg-gray-900 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {label}
                  {counts[f as keyof typeof counts] > 0 && f !== 'all' && (
                    <span className={`text-xs px-1 rounded-full ${filter===f?'bg-white/20 text-white':'bg-gray-100 text-gray-500'}`}>{counts[f as keyof typeof counts]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Document list */}
          <div className="p-4 md:p-6 pt-3">
            {filtered.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
                <div className="text-4xl mb-3">📂</div>
                <p className="font-medium text-gray-900 mb-1">No documents found</p>
                <p className="text-sm text-gray-500 mb-4">{docs.length===0?'Add your first document.':'Try different filters.'}</p>
                {docs.length===0&&<button onClick={openAdd} className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus size={14}/>Add document</button>}
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="space-y-2 md:hidden">
                  {filtered.map((doc:any) => {
                    const st = getStatus(doc.expiryDate)
                    return (
                      <div key={doc.id} className="bg-white border border-gray-100 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{CAT_ICONS[doc.category]||'📄'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-gray-900 text-sm leading-tight">{doc.name}</p>
                              <span className={`${st.cls} flex-shrink-0`}>{st.label}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{doc.category.replace(/_/g,' ')}</p>
                            <div className="flex items-center justify-between mt-2">
                              <div>
                                <p className="text-xs text-gray-600">{format(new Date(doc.expiryDate),'dd MMM yyyy')}</p>
                                <p className="text-xs font-medium mt-0.5" style={{color:st.color}}>{st.days<0?`${Math.abs(st.days)}d ago`:st.days===0?'Today':`${st.days}d left`}</p>
                              </div>
                              <div className="flex gap-1">
                                {doc.fileUrl && <button onClick={()=>setViewerDoc(doc)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"><FileText size={14}/></button>}
                                <button onClick={()=>setViewDetailDoc(doc)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"><Eye size={14}/></button>
                                <button onClick={()=>openEdit(doc)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"><Pencil size={14}/></button>
                                <button onClick={()=>setDeleteId(doc.id)} className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded transition-colors"><Trash2 size={14}/></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-64">Document</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Category</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Expiry</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Remaining</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">File</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                      </tr></thead>
                      <tbody>
                        {filtered.map((doc:any) => {
                          const st = getStatus(doc.expiryDate)
                          return (
                            <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">{CAT_ICONS[doc.category]||'📄'}</span>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate max-w-48">{doc.name}</p>
                                    {doc.documentNo&&<p className="text-xs text-gray-400">#{doc.documentNo}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{doc.category.replace(/_/g,' ')}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{format(new Date(doc.expiryDate),'dd MMM yyyy')}</td>
                              <td className="px-4 py-3"><span className={st.cls}>{st.label}</span></td>
                              <td className="px-4 py-3 text-sm font-medium whitespace-nowrap" style={{color:st.color}}>{st.days<0?`${Math.abs(st.days)}d ago`:st.days===0?'Today':`${st.days}d`}</td>
                              <td className="px-4 py-3">
                                {doc.fileUrl
                                  ? <button onClick={()=>setViewerDoc(doc)} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                                      <FileText size={13}/>{doc.fileName?doc.fileName.slice(0,16)+'...':'View file'}
                                    </button>
                                  : <span className="text-xs text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={()=>setViewDetailDoc(doc)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Details"><Eye size={14}/></button>
                                  <button onClick={()=>openEdit(doc)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Edit"><Pencil size={14}/></button>
                                  <button onClick={()=>setDeleteId(doc.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 size={14}/></button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-gray-900">{editDoc?'Edit document':'Add document'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="label">Document name *</label>
                <input className="input" placeholder="e.g. National ID Card" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
              </div>
              <div>
                <label className="label">Category *</label>
                <select className="input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Expiry date *</label>
                  <input type="date" className="input" value={form.expiryDate} onChange={e=>setForm({...form,expiryDate:e.target.value})} required/>
                </div>
                <div>
                  <label className="label">Issue date</label>
                  <input type="date" className="input" value={form.issueDate} onChange={e=>setForm({...form,issueDate:e.target.value})}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Document number</label>
                  <input className="input" placeholder="A1234567" value={form.documentNo} onChange={e=>setForm({...form,documentNo:e.target.value})}/>
                </div>
                <div>
                  <label className="label">Issued by</label>
                  <input className="input" placeholder="e.g. Govt of India" value={form.issuedBy} onChange={e=>setForm({...form,issuedBy:e.target.value})}/>
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input resize-none h-16" placeholder="Renewal takes 2 weeks..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
              </div>
              {/* File upload */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Attach file <span className="font-normal text-gray-400">(optional)</span></label>
                  {form.fileUrl && session?.workspace?.plan === 'ENTERPRISE' && (
                    <button type="button" onClick={async()=>{
                      toast.info('Scanning document...')
                      try {
                        const res = await fetch('/api/documents/ai-scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fileUrl:form.fileUrl,fileName:form.fileName})})
                        const data = await res.json()
                        if(!res.ok) throw new Error(data.error)
                        const e = data.extracted
                        setForm((f:any)=>({...f,...(e.documentName&&!f.name?{name:e.documentName}:{}),(e.expiryDate?{expiryDate:e.expiryDate}:{}),(e.issueDate?{issueDate:e.issueDate}:{}),(e.documentNo?{documentNo:e.documentNo}:{}),(e.issuedBy?{issuedBy:e.issuedBy}:{}),(e.category?{category:e.category}:{})}))
                        toast.success('Fields auto-filled from document!')
                      } catch(err:any){toast.error(err.message)}
                    }} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                      ✨ AI auto-fill
                    </button>
                  )}
                </div>
                <FileUploader
                  existingUrl={form.fileUrl}
                  existingName={form.fileName}
                  onUpload={({url,fileName,fileSize,mimeType})=>setForm((f:any)=>({...f,fileUrl:url,fileName,fileSize,mimeType}))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving?'Saving...':editDoc?'Update':'Add document'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {viewDetailDoc && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e=>e.target===e.currentTarget&&setViewDetailDoc(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Document details</h2>
              <button onClick={()=>setViewDetailDoc(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <div className="p-5">
              {(() => {
                const doc = viewDetailDoc
                const st = getStatus(doc.expiryDate)
                return (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl">{CAT_ICONS[doc.category]||'📄'}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.category.replace(/_/g,' ')}</p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label:'Status', value:<span className={st.cls}>{st.label}</span> },
                        { label:'Expiry date', value:format(new Date(doc.expiryDate),'dd MMMM yyyy') },
                        { label:'Days', value:<span style={{color:st.color}}>{st.days<0?`Expired ${Math.abs(st.days)} days ago`:st.days===0?'Expires today':`${st.days} days remaining`}</span> },
                        ...(doc.issueDate?[{label:'Issue date',value:format(new Date(doc.issueDate),'dd MMMM yyyy')}]:[]),
                        ...(doc.documentNo?[{label:'Document no.',value:`#${doc.documentNo}`}]:[]),
                        ...(doc.issuedBy?[{label:'Issued by',value:doc.issuedBy}]:[]),
                        ...(doc.notes?[{label:'Notes',value:doc.notes}]:[]),
                        ...(doc.fileName?[{label:'File',value:<button onClick={()=>{setViewDetailDoc(null);setViewerDoc(doc)}} className="text-blue-600 text-sm hover:underline flex items-center gap-1"><FileText size={13}/>{doc.fileName}</button>}]:[]),
                      ].map((row:any,i)=>(
                        <div key={i} className="flex justify-between items-start py-2 border-b border-gray-50 gap-4">
                          <span className="text-sm text-gray-500 flex-shrink-0">{row.label}</span>
                          <span className="text-sm font-medium text-gray-900 text-right">{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={()=>{setViewDetailDoc(null);openEdit(doc)}} className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm"><Pencil size={13}/>Edit</button>
                      <button onClick={()=>setViewDetailDoc(null)} className="flex-1 btn-primary text-sm">Close</button>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* File Viewer */}
      {viewerDoc?.fileUrl && (
        <DocumentViewer
          url={viewerDoc.fileUrl}
          fileName={viewerDoc.fileName || viewerDoc.name}
          mimeType={viewerDoc.mimeType || 'application/pdf'}
          onClose={()=>setViewerDoc(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-3"><AlertCircle size={20} className="text-red-500"/></div>
            <h3 className="font-semibold text-gray-900 mb-1">Delete document?</h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone. The file will also be removed.</p>
            <div className="flex gap-3">
              <button onClick={()=>setDeleteId(null)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={()=>handleDelete(deleteId)} className="flex-1 btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
