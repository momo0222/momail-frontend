import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import type { UserFile } from "../types";

export function useUserFiles(){
    return useQuery({
        queryKey: ['user-files'],
        queryFn: async () => {
            const response = await apiClient.get("/api/files/");
            return response.data as UserFile[];
        }
    });
}

export function useUploadUserFile(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({file, fileType}: {file: File, fileType: String}) => {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiClient.post(`api/files/?file_type=${fileType}}`, formData, {
                headers: {'Content-Type': "multipart/form-data"}
            });

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['user-files']});
        }
    });
}

export function useDeleteUserFile(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (fileId: number) => apiClient.delete(`/api/files/${fileId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['user-files']});
        }
    });
}

export function useFileContent(fileId: number | null){
    return useQuery({
        queryKey: ['file-content', fileId],
        queryFn: async () => {
            const response = await apiClient.get(`/api/files/${fileId}/content`);
            return response.data as { filename: string, content: string, size: number};
        },
        enabled: !!fileId
    })
}