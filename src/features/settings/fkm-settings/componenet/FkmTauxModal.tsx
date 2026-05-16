import React, { useEffect, useState } from 'react';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';


type Props = {
  open: boolean;
  onClose: () => void;
};

export default function FkmTauxModal({ open, onClose }: Props) {
  const { t } = useLanguage();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      apiClient
        .get(apiRoutes.admin.settings.showByKey('fkm_taux'))
        .then((res) => setValue(res.data.value))
        .catch(() => toast.error(t('admin.settings.fkmTaux.fetchError')))
        .finally(() => setLoading(false));
    }
  }, [open, t]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(apiRoutes.admin.settings.updtaeParKey('fkm_taux'), { value });
      toast.success(t('admin.settings.fkmTaux.saveSuccess'));
      onClose();
    } catch {
      toast.error(t('admin.settings.fkmTaux.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t('admin.settings.fkmTaux.title')}
      description={t('admin.settings.fkmTaux.description')}
    >
      {loading ? (
        <div>{t('common.loading')}</div>
      ) : (
        <div className="space-y-4">
          <label className="block font-medium">{t('admin.settings.fkmTaux.label')}</label>
          <Input
            value={value}
            onChange={e => setValue(e.target.value)}
            disabled={saving}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving || loading}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || loading} loading={saving}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}