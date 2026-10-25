import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Alert } from 'antd';
import { FiLock, FiCheck } from 'react-icons/fi';
import authApi from '../../api/auth.api';
import { useAuth } from '../../contexts/AuthContext';

export const ChangePasswordModal = ({ open, onClose, isForced = false }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { refreshUser, setMustChangePassword } = useAuth();

  const handleFinish = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      setErrorMsg('New password and confirm password do not match');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      message.success('Password changed successfully');
      form.resetFields();
      setMustChangePassword(false);
      await refreshUser();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
          <FiLock className="w-5 h-5 text-indigo-600" />
          <span>{isForced ? 'Set Your New Password' : 'Change Password'}</span>
        </div>
      }
      open={open}
      onCancel={isForced ? undefined : onClose}
      closable={!isForced}
      maskClosable={!isForced}
      footer={null}
      destroyOnClose
    >
      <div className="py-2 space-y-4">
        {isForced && (
          <Alert
            type="warning"
            showIcon
            message="Initial Password Change Required"
            description="You are logging in with a temporary password. Please set a new secure password to access your dashboard."
          />
        )}

        {errorMsg && <Alert type="error" showIcon message={errorMsg} />}

        <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark="optional">
          <Form.Item
            name="currentPassword"
            label="Current / Temporary Password"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password placeholder="Enter current password" size="large" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 8, message: 'Password must be at least 8 characters long' },
            ]}
          >
            <Input.Password placeholder="Enter new password (min. 8 characters)" size="large" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            rules={[{ required: true, message: 'Please confirm your new password' }]}
          >
            <Input.Password placeholder="Re-enter new password" size="large" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            {!isForced && (
              <Button onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
            )}
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              className="bg-indigo-600 hover:bg-indigo-700"
              icon={<FiCheck className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;
