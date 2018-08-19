import * as React from 'react';

export interface IPageComponentProps {}
export interface IPageComponentState {}

interface IWithLoadingProps {
    loading: boolean;
}

export function withLoading<P extends object>(Component: React.ComponentType<P>) {
    return class WithLoading extends React.Component<P & IWithLoadingProps, IPageComponentState> {
        render() {
            const { loading, ...props } = this.props as IWithLoadingProps;
            return loading ? <LoadingSpinner /> : <Component {...props} />;
        }
    };
}
