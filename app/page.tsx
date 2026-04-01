"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePersonStore } from "@/store/person-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Users, Calendar, ArrowRight, FolderOpen, Trash2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { persons, addPerson, deletePerson, loadFromStorage } = usePersonStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  
  // 删除确认弹窗状态
  const [personToDelete, setPersonToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // 加载 localStorage 数据
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleCreatePerson = () => {
    if (newPersonName.trim()) {
      addPerson(newPersonName.trim());
      setNewPersonName("");
      setIsDialogOpen(false);
    }
  };

  const handleSelectPerson = (id: string) => {
    router.push(`/person/${id}`);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "progress":
        return "进行中";
      case "completed":
        return "已完成";
      case "needs-fix":
        return "待修正";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "progress":
        return "bg-zinc-100 text-zinc-800 border-zinc-200/60";
      case "completed":
        return "bg-zinc-900 text-zinc-50 border-zinc-900";
      case "needs-fix":
        return "bg-zinc-50 text-zinc-600 border-zinc-300 border-dashed";
      default:
        return "bg-zinc-50 text-zinc-500 border-zinc-200";
    }
  };

  const getStatusDotConfig = (status: string) => {
    switch (status) {
      case "progress":
        return "bg-zinc-900 animate-pulse";
      case "completed":
        return "bg-zinc-300";
      case "needs-fix":
        return "bg-zinc-400";
      default:
        return "bg-zinc-300";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 font-sans text-zinc-950 selection:bg-zinc-200">
      {/* 极简高级 Header 区 */}
      <div className="bg-white border-b border-zinc-200/60 pb-20 pt-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tighter text-zinc-950">
                发展党员管理系统
              </h1>
              <p className="text-zinc-500 text-base md:text-lg max-w-lg font-medium tracking-tight">
                高效、规范的时间节点跟踪与档案管理
              </p>
            </div>
            
            {/* 统计概览摘要 */}
            <div className="flex gap-4 mb-1">
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-3 text-center min-w-[100px] shadow-sm">
                <div className="text-3xl font-bold tracking-tight text-zinc-900 leading-none mb-1">{persons.length}</div>
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">管理对象</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 - 上浮叠加效果 */}
      <main className="container mx-auto px-6 max-w-5xl -mt-8 relative z-10 pb-24">
        
        {/* 控制面板 */}
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-md rounded-t-2xl p-6 md:px-8 border border-zinc-200/80 shadow-sm border-b-0">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2.5 tracking-tight">
            <Users className="w-5 h-5 text-zinc-900" strokeWidth={2.5} />
            人员名册
          </h2>
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            className="bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm hover:shadow transition-all rounded-full px-5 py-2 h-10 font-medium"
          >
            <Plus className="mr-1.5 h-4 w-4" strokeWidth={2.5} /> 新建建档
          </Button>
        </div>

        {/* 列表内容 */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-zinc-200/80 min-h-[400px] p-6 lg:p-8">
          {persons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center mb-6">
                <FolderOpen className="w-8 h-8 text-zinc-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2 tracking-tight">暂无档案数据</h3>
              <p className="text-zinc-500 mb-8 max-w-sm text-sm">
                您还没有创建任何发展对象档案。点击下方按钮开始规范化管理。
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)} 
                className="bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm rounded-full px-6"
              >
                <Plus className="mr-2 h-4 w-4" /> 创建第一份档案
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {persons.map((person) => (
                <Card
                  key={person.id}
                  className="group cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border border-zinc-200 hover:border-zinc-300 bg-white overflow-hidden relative rounded-xl"
                  onClick={() => handleSelectPerson(person.id)}
                >
                  {/* 删除按钮 - 默认隐藏，悬停显示 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPersonToDelete({ id: person.id, name: person.name });
                      setIsDeleteConfirmOpen(true);
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm border border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all z-20 shadow-sm"
                    title="删除档案"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* 左侧动态指示条 */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-zinc-900 transition-colors duration-300" />
                  
                  <CardHeader className="p-5 pl-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        {/* 姓名首字母简白头像 */}
                        <div className="w-11 h-11 rounded-full bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-900 font-bold text-lg group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-300">
                          {person.name.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold text-zinc-900 tracking-tight">
                            {person.name}
                          </CardTitle>
                          <p className="text-[11px] font-medium text-zinc-500 flex items-center mt-1 uppercase tracking-wider">
                            <Calendar className="w-3 h-3 mr-1.5 opacity-70" />
                            {person.createdAt}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-5 flex items-center justify-between pt-4 border-t border-zinc-100 group-hover:border-zinc-200 transition-colors">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 transition-colors ${getStatusColor(person.status)}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotConfig(person.status)}`}></span>
                        {getStatusText(person.status)}
                      </span>
                      <div className="text-zinc-900 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 flex items-center text-xs font-semibold">
                        查看 <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 新建对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md border-zinc-200 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">新建建档</DialogTitle>
          </DialogHeader>
          <div className="py-5">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-semibold text-zinc-700">人员姓名</Label>
              <Input
                id="name"
                placeholder="请输入真实姓名"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                className="h-11 border-zinc-300 focus-visible:ring-zinc-900 rounded-lg bg-zinc-50/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreatePerson();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-full border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
              取消
            </Button>
            <Button onClick={handleCreatePerson} className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-full px-6 transition-colors">
              确认创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 删除确认对话框 */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md border-zinc-200 shadow-2xl rounded-2xl p-0 overflow-hidden">
          <div className="p-6 pt-8 text-center">
            <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-zinc-900" strokeWidth={1.5} />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 mb-2">删除确认</DialogTitle>
            <p className="text-zinc-500 text-sm leading-relaxed px-4">
              确定要永久删除 <span className="text-zinc-950 font-bold underline decoration-zinc-300 underline-offset-4">{personToDelete?.name}</span> 的所有档案数据吗？此操作不可撤销。
            </p>
          </div>
          <div className="flex border-t border-zinc-100">
            <button 
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="flex-1 py-4 text-sm font-semibold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors border-r border-zinc-100"
            >
              取消
            </button>
            <button 
              onClick={() => {
                if (personToDelete) {
                  deletePerson(personToDelete.id);
                  setIsDeleteConfirmOpen(false);
                }
              }}
              className="flex-1 py-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              确认删除
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
